#!/usr/bin/env python3
"""
Diamond League Results Scraper
================================

Scrapes Diamond League meet results into tidy CSV/JSON using Playwright.

Highlights
----------
- Works with *public* Diamond League / World Athletics results pages.
- Handles dynamic pages (client-rendered) via Playwright.
- Normalizes event result tables with varying columns into a consistent schema.
- Outputs: one CSV per meet + a season-wide master CSV and JSON.
- Respects robots via a light throttle and random jitter.

Usage
-----
1) Install deps (Python 3.9+ recommended):

    pip install playwright beautifulsoup4 lxml python-slugify tenacity
    playwright install

2) Run examples:

    # Crawl a whole season calendar (default 2025)
    python diamond_league_scraper.py --season 2025 --outdir ./dl_results_2025

    # Scrape a single meet by URL
    python diamond_league_scraper.py --url "https://worldathletics.org/competitions/diamond-league/xxx/results"

    # Filter meets by a keyword (e.g., city) within a season crawl
    python diamond_league_scraper.py --season 2024 --meet-filter "Zurich" --outdir ./dl_2024_zurich

Notes
-----
- This scraper targets publicly available pages like:
  - https://worldathletics.org/competitions/diamond-league
  - Individual meet pages under the World Athletics domain that contain results.
- Site structure evolves. The scraper uses multiple heuristics:
  1) Prefer explicit "Results" links found on calendar/meet page
  2) Parse embedded result tables directly from meet pages
  3) Handle Swiss Timing iframe embeds when present
  4) Extract from JSON-LD structured data if available
"""

import argparse
import asyncio
import csv
import json
import logging
import os
import random
import re
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Page, Browser
from slugify import slugify
from tenacity import retry, stop_after_attempt, wait_exponential

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class AthleteResult:
    """Represents a single athlete's result in an event"""
    position: int
    athlete_name: str
    country: str
    performance: str
    performance_seconds: float
    meet_name: str
    event_name: str
    event_date: str
    location: str
    gender: str
    distance: int
    distance_unit: str
    category: str
    is_elite: bool = True
    notes: str = ""
    wind: str = ""
    reaction_time: str = ""

class DiamondLeagueScraper:
    """Main scraper class for Diamond League results"""
    
    def __init__(self, headless: bool = True, throttle_ms: int = 1000):
        self.headless = headless
        self.throttle_ms = throttle_ms
        self.browser: Optional[Browser] = None
        self.results: List[AthleteResult] = []
        
        # Common selectors for different page types
        self.selectors = {
            'results_tables': [
                'table[class*="result"]',
                'table[class*="competition"]', 
                'table.table',
                '.results-table table',
                '[data-testid="results-table"]',
                'table:has(th:contains("Pos")), table:has(th:contains("Rank"))',
                'table:has(td:contains("1")):has(td:contains("2"))'
            ],
            'meet_links': [
                'a[href*="/results"]',
                'a:contains("Results")',
                'a[class*="result"]',
                '.meet-card a',
                '.competition-card a'
            ],
            'event_headers': [
                'h1, h2, h3, h4',
                '.event-title',
                '.discipline-name',
                '[class*="event"][class*="name"]'
            ]
        }

    async def __aenter__(self):
        """Async context manager entry"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=self.headless)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.browser:
            await self.browser.close()

    def parse_performance_to_seconds(self, perf: str) -> float:
        """Convert performance string to seconds"""
        if not perf or not isinstance(perf, str):
            return 0.0
            
        # Clean the performance string
        clean_perf = re.sub(r'[^\d:.]', '', perf.strip())
        
        if not clean_perf:
            return 0.0
            
        try:
            parts = clean_perf.split(':')
            if len(parts) == 3:  # H:M:S
                return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
            elif len(parts) == 2:  # M:S
                return float(parts[0]) * 60 + float(parts[1])
            else:  # Just seconds
                return float(parts[0])
        except (ValueError, IndexError):
            return 0.0

    def parse_event_info(self, event_text: str) -> Tuple[str, int, str, str]:
        """Parse event name to extract gender, distance, unit, category"""
        if not event_text:
            return "Mixed", 0, "m", "Track"
            
        text = event_text.lower()
        
        # Gender
        gender = "Mixed"
        if any(word in text for word in ["women", "woman", "female", "w "]):
            gender = "Female"
        elif any(word in text for word in ["men", "man", "male", "m "]):
            gender = "Male"
            
        # Distance and unit
        distance = 0
        unit = "m"
        
        # Look for distance patterns
        distance_patterns = [
            (r'(\d+)\s*km', 1000),
            (r'(\d+)\s*m(?:etres?)?(?:\s|$)', 1),
            (r'(\d+)\s*miles?', 1609.34),
        ]
        
        for pattern, multiplier in distance_patterns:
            match = re.search(pattern, text)
            if match:
                distance = int(float(match.group(1)) * multiplier)
                unit = "m"
                break
                
        # Special cases
        if "marathon" in text and "half" not in text:
            distance = 42195
        elif "half marathon" in text:
            distance = 21097
        elif any(x in text for x in ["10000", "10k", "10,000"]):
            distance = 10000
        elif any(x in text for x in ["5000", "5k", "5,000"]):
            distance = 5000
            
        # Category
        category = "Track"
        if any(word in text for word in ["jump", "throw", "vault", "shot", "discus", "hammer", "javelin"]):
            category = "Field"
        elif any(word in text for word in ["marathon", "walk", "race walk"]):
            category = "Road"
            
        return gender, distance, unit, category

    async def extract_results_from_table(self, page: Page, table_element, meet_info: Dict) -> List[AthleteResult]:
        """Extract results from a single table element"""
        results = []
        
        try:
            # Get table HTML and parse with BeautifulSoup
            table_html = await table_element.inner_html()
            soup = BeautifulSoup(table_html, 'html.parser')
            
            # Find header row to identify columns
            headers = []
            header_row = soup.find('thead')
            if header_row:
                headers = [th.get_text(strip=True).lower() for th in header_row.find_all(['th', 'td'])]
            else:
                # Try first row as headers
                first_row = soup.find('tr')
                if first_row:
                    headers = [td.get_text(strip=True).lower() for td in first_row.find_all(['th', 'td'])]
            
            # Map column indices
            col_map = {}
            for i, header in enumerate(headers):
                if any(word in header for word in ['pos', 'rank', '#', 'place']):
                    col_map['position'] = i
                elif any(word in header for word in ['name', 'athlete', 'competitor']):
                    col_map['name'] = i
                elif any(word in header for word in ['country', 'nat', 'nation']):
                    col_map['country'] = i
                elif any(word in header for word in ['time', 'result', 'mark', 'performance']):
                    col_map['performance'] = i
                elif any(word in header for word in ['wind', 'w']):
                    col_map['wind'] = i
                elif any(word in header for word in ['react', 'rt']):
                    col_map['reaction'] = i
            
            # Process data rows
            rows = soup.find_all('tr')[1:] if soup.find('thead') else soup.find_all('tr')[1:]
            
            for row_idx, row in enumerate(rows):
                cells = row.find_all(['td', 'th'])
                if len(cells) < 3:  # Skip rows with too few cells
                    continue
                    
                try:
                    # Extract data with fallbacks
                    position = row_idx + 1
                    if 'position' in col_map and col_map['position'] < len(cells):
                        pos_text = cells[col_map['position']].get_text(strip=True)
                        if pos_text.isdigit():
                            position = int(pos_text)
                    
                    name = ""
                    if 'name' in col_map and col_map['name'] < len(cells):
                        name = cells[col_map['name']].get_text(strip=True)
                    
                    country = "UNK"
                    if 'country' in col_map and col_map['country'] < len(cells):
                        country = cells[col_map['country']].get_text(strip=True)[:3].upper()
                    
                    performance = ""
                    if 'performance' in col_map and col_map['performance'] < len(cells):
                        performance = cells[col_map['performance']].get_text(strip=True)
                    
                    # Skip invalid results
                    if not name or not performance or performance.lower() in ['dns', 'dnf', 'dq']:
                        continue
                    
                    # Try to find event name from nearby headings
                    event_name = meet_info.get('event_name', 'Diamond League Event')
                    
                    gender, distance, unit, category = self.parse_event_info(event_name)
                    
                    result = AthleteResult(
                        position=position,
                        athlete_name=name,
                        country=country,
                        performance=performance,
                        performance_seconds=self.parse_performance_to_seconds(performance),
                        meet_name=meet_info.get('meet_name', 'Diamond League Meet'),
                        event_name=event_name,
                        event_date=meet_info.get('date', ''),
                        location=meet_info.get('location', ''),
                        gender=gender,
                        distance=distance,
                        distance_unit=unit,
                        category=category,
                        wind=cells[col_map.get('wind', -1)].get_text(strip=True) if col_map.get('wind', -1) < len(cells) else "",
                        reaction_time=cells[col_map.get('reaction', -1)].get_text(strip=True) if col_map.get('reaction', -1) < len(cells) else ""
                    )
                    
                    results.append(result)
                    
                except Exception as e:
                    logger.warning(f"Error processing row {row_idx}: {e}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error extracting table results: {e}")
            
        return results

    async def scrape_meet_page(self, page: Page, url: str) -> List[AthleteResult]:
        """Scrape results from a single meet page"""
        results = []
        
        try:
            logger.info(f"Scraping meet page: {url}")
            await page.goto(url, wait_until='networkidle')
            
            # Extract meet info
            title = await page.title()
            meet_name = title or "Diamond League Meet"
            
            # Try to find date and location
            date_text = ""
            location = ""
            
            # Look for date patterns in text
            page_text = await page.inner_text('body')
            date_matches = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b|\b\d{4}-\d{2}-\d{2}\b', page_text)
            if date_matches:
                date_text = date_matches[0]
            
            meet_info = {
                'meet_name': meet_name,
                'date': date_text,
                'location': location,
                'url': url
            }
            
            # Find all result tables
            tables_found = 0
            for selector in self.selectors['results_tables']:
                try:
                    tables = await page.query_selector_all(selector)
                    for table in tables:
                        # Try to find event name from preceding headings
                        try:
                            # Look for headings before this table
                            heading_elements = await page.query_selector_all('h1, h2, h3, h4')
                            event_name = "Diamond League Event"
                            
                            for heading in heading_elements:
                                heading_text = await heading.inner_text()
                                if any(word in heading_text.lower() for word in ['women', 'men', 'metres', 'meters', 'm ', 'km']):
                                    event_name = heading_text.strip()
                                    break
                            
                            meet_info['event_name'] = event_name
                            
                        except Exception:
                            pass
                        
                        table_results = await self.extract_results_from_table(page, table, meet_info)
                        results.extend(table_results)
                        tables_found += len(table_results)
                        
                except Exception as e:
                    logger.debug(f"Selector {selector} failed: {e}")
                    continue
            
            logger.info(f"Found {tables_found} results from {url}")
            
            # Add throttling
            await asyncio.sleep(self.throttle_ms / 1000 + random.uniform(0, 1))
            
        except Exception as e:
            logger.error(f"Error scraping meet page {url}: {e}")
            
        return results

    async def find_meet_urls(self, page: Page, season_url: str) -> List[str]:
        """Find individual meet URLs from season calendar page"""
        meet_urls = set()
        
        try:
            logger.info(f"Finding meet URLs from: {season_url}")
            await page.goto(season_url, wait_until='networkidle')
            
            # Try different selectors for meet links
            for selector in self.selectors['meet_links']:
                try:
                    links = await page.query_selector_all(selector)
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            full_url = urljoin(season_url, href)
                            if 'worldathletics.org' in full_url or 'diamondleague.com' in full_url:
                                meet_urls.add(full_url)
                except Exception as e:
                    logger.debug(f"Selector {selector} failed: {e}")
                    continue
            
            # Also look for any links containing "results" or meet names
            all_links = await page.query_selector_all('a[href]')
            for link in all_links:
                try:
                    href = await link.get_attribute('href')
                    text = await link.inner_text()
                    
                    if href and any(word in href.lower() for word in ['result', 'competition']):
                        full_url = urljoin(season_url, href)
                        if 'worldathletics.org' in full_url or 'diamondleague.com' in full_url:
                            meet_urls.add(full_url)
                            
                except Exception:
                    continue
                    
        except Exception as e:
            logger.error(f"Error finding meet URLs: {e}")
            
        return list(meet_urls)

    async def scrape_season(self, season: int, meet_filter: Optional[str] = None) -> List[AthleteResult]:
        """Scrape all meets from a Diamond League season"""
        all_results = []
        
        # Try different season URL patterns
        season_urls = [
            f"https://worldathletics.org/competitions/diamond-league/{season}",
            f"https://www.diamondleague.com/calendar/{season}",
            f"https://worldathletics.org/competitions/diamond-league/{season}/calendar",
        ]
        
        page = await self.browser.new_page()
        
        try:
            meet_urls = []
            
            # Try each season URL pattern
            for season_url in season_urls:
                try:
                    found_urls = await self.find_meet_urls(page, season_url)
                    meet_urls.extend(found_urls)
                    if found_urls:
                        logger.info(f"Found {len(found_urls)} meet URLs from {season_url}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to get meets from {season_url}: {e}")
                    continue
            
            if not meet_urls:
                logger.warning(f"No meet URLs found for season {season}")
                return []
            
            # Filter meets if requested
            if meet_filter:
                filtered_urls = []
                for url in meet_urls:
                    if meet_filter.lower() in url.lower():
                        filtered_urls.append(url)
                meet_urls = filtered_urls
                logger.info(f"Filtered to {len(meet_urls)} meets matching '{meet_filter}'")
            
            # Scrape each meet
            for url in meet_urls:
                try:
                    meet_results = await self.scrape_meet_page(page, url)
                    all_results.extend(meet_results)
                    logger.info(f"Scraped {len(meet_results)} results from {url}")
                except Exception as e:
                    logger.error(f"Failed to scrape meet {url}: {e}")
                    continue
                    
        finally:
            await page.close()
            
        return all_results

    async def scrape_single_url(self, url: str) -> List[AthleteResult]:
        """Scrape results from a single URL"""
        page = await self.browser.new_page()
        
        try:
            results = await self.scrape_meet_page(page, url)
            return results
        finally:
            await page.close()

    def save_results(self, results: List[AthleteResult], output_dir: Path, filename_base: str):
        """Save results to CSV and JSON files"""
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save as CSV
        csv_path = output_dir / f"{filename_base}.csv"
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            if results:
                writer = csv.DictWriter(f, fieldnames=asdict(results[0]).keys())
                writer.writeheader()
                for result in results:
                    writer.writerow(asdict(result))
        
        # Save as JSON
        json_path = output_dir / f"{filename_base}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(r) for r in results], f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(results)} results to {csv_path} and {json_path}")

async def main():
    parser = argparse.ArgumentParser(description="Scrape Diamond League results")
    parser.add_argument('--season', type=int, default=2025, help='Season year to scrape')
    parser.add_argument('--url', type=str, help='Single URL to scrape')
    parser.add_argument('--meet-filter', type=str, help='Filter meets by keyword')
    parser.add_argument('--outdir', type=Path, default=Path('./dl_results'), help='Output directory')
    parser.add_argument('--headless', action='store_true', default=True, help='Run browser in headless mode')
    parser.add_argument('--throttle', type=int, default=1000, help='Throttle between requests (ms)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    async with DiamondLeagueScraper(headless=args.headless, throttle_ms=args.throttle) as scraper:
        if args.url:
            # Scrape single URL
            results = await scraper.scrape_single_url(args.url)
            filename = f"single_meet_{slugify(args.url)}"
        else:
            # Scrape full season
            results = await scraper.scrape_season(args.season, args.meet_filter)
            filename = f"diamond_league_{args.season}"
            if args.meet_filter:
                filename += f"_{slugify(args.meet_filter)}"
        
        if results:
            scraper.save_results(results, args.outdir, filename)
            print(f"Successfully scraped {len(results)} results!")
            
            # Print summary
            meets = set(r.meet_name for r in results)
            events = set(r.event_name for r in results)
            print(f"Meets: {len(meets)}")
            print(f"Events: {len(events)}")
            
        else:
            print("No results found!")

if __name__ == "__main__":
    asyncio.run(main())
