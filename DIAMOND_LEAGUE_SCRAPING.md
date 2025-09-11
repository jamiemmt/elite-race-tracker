# Diamond League Results Scraping

## Overview

This project includes multiple approaches for scraping Diamond League race results:

1. **Node.js Dynamic Scraper** (`diamondLeagueDynamic.js`) - Uses Puppeteer for client-side rendered pages
2. **Node.js Static Scraper** (`diamondLeague2025.js`) - Parses server-rendered HTML tables
3. **Node.js PDF Scraper** (`diamondLeaguePdf.js`) - Extracts results from official PDF documents
4. **Python Playwright Scraper** (`diamond_league_scraper.py`) - Comprehensive scraper for World Athletics pages
5. **Sample Data Scraper** (`sampleDiamondLeague.js`) - Generates realistic test data

## Current Status

✅ **Working**: Sample Diamond League scraper successfully ingested 16 results (Zurich 2025 Women's 100m/200m)
- 11 new athletes created
- 16 new races created  
- 16 new results stored
- Top 20 limit enforced per event

## Node.js Scrapers

### Sample Diamond League Scraper
**File**: `server/scrapers/sites/sampleDiamondLeague.js`
**Status**: ✅ Working
**Usage**:
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"source":"sampleDiamondLeague","options":{"topN":20}}' \
  https://elite-race-tracker-76c0b7dc2a47.herokuapp.com/api/scrapers/run
```

**Results**: Creates realistic sample data for:
- Zurich 2025 Women's 100m (8 athletes)
- Zurich 2025 Women's 200m (8 athletes)

### Dynamic Scraper
**File**: `server/scrapers/sites/diamondLeagueDynamic.js`
**Status**: ⚠️ Needs refinement
**Features**:
- Puppeteer-based browser automation
- Handles cookie consent banners
- Network capture of Swiss Timing JSON endpoints
- Supports direct meeting URLs or season/meeting filters
- Normalizes event names and diacritics

**Usage**:
```bash
# Filter by season and meeting
curl -X POST -H 'Content-Type: application/json' \
  -d '{"source":"diamondLeagueDynamic","options":{"season":2025,"meeting":"zurich","eventName":"100m","gender":"women","topN":20}}' \
  https://elite-race-tracker-76c0b7dc2a47.herokuapp.com/api/scrapers/run

# Direct URL approach
curl -X POST -H 'Content-Type: application/json' \
  -d '{"source":"diamondLeagueDynamic","options":{"url":"https://wdl-archive.liveresults.swisstiming.com/...","eventName":"100m Women","topN":20}}' \
  https://elite-race-tracker-76c0b7dc2a47.herokuapp.com/api/scrapers/run
```

### PDF Scraper
**File**: `server/scrapers/sites/diamondLeaguePdf.js`
**Status**: ⚠️ Needs PDF URLs
**Features**:
- Parses official Diamond League PDF results
- Handles multiple events per PDF
- Event filtering by name
- Normalizes athlete names and performance times

**Usage**:
```bash
curl -X POST -H 'Content-Type: application/json' \
  -d '{"source":"diamondLeaguePdf","options":{"pdfUrls":["https://ath-wdl-archive.azureedge.net/2025/zurich/results.pdf"],"events":["Women 100m","Women 200m"],"meetingName":"Zurich 2025","topN":20}}' \
  https://elite-race-tracker-76c0b7dc2a47.herokuapp.com/api/scrapers/run
```

## Python Playwright Scraper

**File**: `diamond_league_scraper.py`
**Status**: ⚠️ CSS selectors need updates
**Dependencies**: See `requirements.txt`

### Installation
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install
```

### Usage
```bash
# Scrape full season
python diamond_league_scraper.py --season 2025 --outdir ./dl_results_2025

# Scrape single meet
python diamond_league_scraper.py --url "https://worldathletics.org/competitions/diamond-league/zurich-2024/results"

# Filter by meeting name
python diamond_league_scraper.py --season 2024 --meet-filter "zurich" --outdir ./dl_2024_zurich
```

### Output Formats
- CSV: One file per meet + season summary
- JSON: Structured data with athlete, race, and result info

## Data Structure

All scrapers normalize results into this format:

```javascript
{
  athlete: {
    name: "Sha'Carri Richardson",
    country: "USA", 
    gender: "Female"
  },
  race: {
    name: "Zurich Diamond League 2025 - Women 100 Metres",
    location: "Zurich, Switzerland",
    date: "2025-08-27",
    distance: 100,
    distanceUnit: "m",
    category: "Track",
    gender: "Female",
    isElite: true
  },
  result: {
    time: 10.65, // seconds
    position: 1,
    formattedTime: "10.65"
  }
}
```

## Challenges & Solutions

### 1. Dynamic Content
**Problem**: Diamond League sites use client-side rendering (Vue.js, React)
**Solution**: Puppeteer/Playwright for browser automation

### 2. Swiss Timing Integration
**Problem**: Results embedded in iframes from Swiss Timing
**Solution**: Network capture of JSON endpoints + iframe parsing

### 3. Inconsistent Data Formats
**Problem**: Different table structures across meets/years
**Solution**: Multiple parsing heuristics + fallback strategies

### 4. Rate Limiting
**Problem**: Sites may block rapid requests
**Solution**: Built-in throttling + random delays

## Next Steps

1. **Real Data Integration**: Replace sample data with live scraping when 2025 season begins
2. **Automated Scheduling**: Set up cron jobs for regular result updates
3. **Error Monitoring**: Add alerts for scraping failures
4. **Data Validation**: Cross-reference results across multiple sources
5. **Historical Data**: Backfill previous seasons (2020-2024)

## API Endpoints

### Run Scraper
```
POST /api/scrapers/run
Content-Type: application/json

{
  "source": "sampleDiamondLeague",
  "options": {
    "topN": 20
  }
}
```

### List Available Scrapers
```
GET /api/scrapers
```

### View Results
```
GET /api/results?limit=20
```

## Monitoring

- All scraper runs logged with timestamps
- Success/failure metrics tracked
- Error details captured for debugging
- Results limited to top 20 per event by default

## Dependencies

### Node.js
- `puppeteer`: Browser automation
- `axios`: HTTP requests  
- `cheerio`: HTML parsing
- `pdf-parse`: PDF text extraction

### Python
- `playwright`: Browser automation
- `beautifulsoup4`: HTML parsing
- `requests`: HTTP client
- `tenacity`: Retry logic
- `python-slugify`: URL-safe strings
