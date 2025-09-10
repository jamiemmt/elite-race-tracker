const BaseScraper = require('../BaseScraper');
const puppeteer = require('puppeteer');

/**
 * Diamond League dynamic results scraper (headless, UI-driven)
 *
 * Opens the official Results & Standings page, filters to the requested season and meeting,
 * expands/reads result tables, and returns standardized results.
 *
 * Options:
 * - season: number | string (default: 2025)
 * - meeting: string (case-insensitive substring match against Meetings filter values)
 * - gender: 'Men' | 'Women' | 'All' (optional)
 * - eventName: string (optional exact/substring of the discipline title to narrow to a single event)
 * - topN: number (honored by controller)
 */
class DiamondLeagueDynamic extends BaseScraper {
  constructor() {
    super('diamondLeagueDynamic', 'https://www.diamondleague.com');
    this.resultsUrl = `${this.baseUrl}/results-standings/results/`;
  }

  parseGender(eventTitle) {
    if (!eventTitle) return 'Mixed';
    const s = eventTitle.toLowerCase();
    if (s.includes("women")) return 'Female';
    if (s.includes("men")) return 'Male';
    return 'Mixed';
  }

  parseDistance(eventTitle) {
    if (!eventTitle) return 0;
    const m = eventTitle.match(/(\d+)\s*(m|km|miles?)/i);
    if (m) {
      const v = parseFloat(m[1]);
      const u = (m[2] || 'm').toLowerCase();
      if (u === 'km') return v * 1000;
      if (u.startsWith('mile')) return Math.round(v * 1609.34);
      return v;
    }
    const s = eventTitle.toLowerCase();
    if (s.includes('marathon') && !s.includes('half')) return 42195;
    if (s.includes('half')) return 21097.5;
    if (s.includes('10000') || s.includes('10k')) return 10000;
    if (s.includes('5000') || s.includes('5k')) return 5000;
    if (s.includes('3000') && !s.includes('steeple')) return 3000;
    if (s.includes('steeple')) return 3000;
    if (s.includes('1500')) return 1500;
    if (s.includes('800')) return 800;
    if (s.includes('400')) return 400;
    if (s.includes('200')) return 200;
    if (s.includes('100')) return 100;
    return 0;
  }

  async scrape(options = {}) {
    const season = options.season || 2025;
    const meetingQuery = (options.meeting || '').trim();
    const genderFilter = (options.gender || 'All').toLowerCase();
    const eventNameFilter = (options.eventName || '').trim().toLowerCase();

    let browser;
    const results = [];

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1366,768',
        ]
      });
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36');

      const targetUrl = `${this.resultsUrl}?season=${encodeURIComponent(String(season))}`;
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Try to set meeting filter by checking inputs named "meetings"
      if (meetingQuery) {
        const foundMeeting = await page.evaluate((mq) => {
          const boxes = Array.from(document.querySelectorAll('input[name="meetings"]'));
          let matched = false;
          for (const box of boxes) {
            const v = (box.value || '').toLowerCase();
            const label = (box.closest('label')?.textContent || '').toLowerCase();
            if (v.includes(mq.toLowerCase()) || label.includes(mq.toLowerCase())) {
              box.checked = true;
              box.dispatchEvent(new Event('change', { bubbles: true }));
              matched = true;
            } else {
              // uncheck others to narrow down
              box.checked = false;
              box.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
          return matched;
        }, meetingQuery);
        // Give the page some time to render the filtered results list
        if (foundMeeting) {
          await page.waitForTimeout(2000);
        }
      }

      // If gender filter requested, try clicking corresponding checkbox set
      if (genderFilter === 'men' || genderFilter === 'women') {
        await page.evaluate((gf) => {
          // look for inputs under disciplines filters for men/women
          const menBtn = document.querySelector('[data-select-type="gender"] input[value="Men"]');
          const womenBtn = document.querySelector('[data-select-type="gender"] input[value="Women"]');
          if (gf === 'men' && menBtn) {
            menBtn.checked = true; menBtn.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (gf === 'women' && womenBtn) {
            womenBtn.checked = true; womenBtn.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, genderFilter);
        await page.waitForTimeout(1200);
      }

      // Expand any collapsible event blocks by clicking toggles with text like 'Results' when present
      // Then parse all tables that look like results (with Rank/Name/Result headers)
      const scraped = await page.evaluate((eventNameFilter) => {
        const parsed = [];

        function text(el) { return (el?.textContent || '').trim(); }

        // Try to click any buttons/links labelled 'Results' to expand sections
        document.querySelectorAll('a, button').forEach((el) => {
          const t = text(el).toLowerCase();
          if (t === 'results' || t === 'records' || t.includes('results')) {
            el.click();
          }
        });

        // Helper: climb up to find nearest title above table
        function nearestTitle(el) {
          let cur = el;
          for (let i = 0; i < 8 && cur; i++) {
            const h = cur.querySelector?.('h2, h3, .event-title, .discipline') || cur.previousElementSibling;
            if (h && text(h)) return text(h);
            cur = cur.parentElement;
          }
          // Fallback global
          const alt = document.querySelector('h2, h3');
          return alt ? text(alt) : 'Diamond League Event';
        }

        // Meeting/venue/date best-effort
        const meetingTitle = text(document.querySelector('.page-title, h1, title')) || 'Diamond League Meeting';
        const venue = text(document.querySelector('.venue, .location')) || '';
        const timeEl = document.querySelector('time');
        const dateStr = timeEl ? timeEl.getAttribute('datetime') || text(timeEl) : '';

        // Collect tables that look like result tables
        const tables = Array.from(document.querySelectorAll('table'));
        for (const table of tables) {
          const headers = Array.from(table.querySelectorAll('thead th, tbody tr:first-child th, tbody tr:first-child td')).map(th => text(th).toLowerCase());
          if (!headers.length) continue;
          const colPos = {
            rank: headers.findIndex(h => h.includes('rank') || h === '#' || h.includes('pos')),
            name: headers.findIndex(h => h.includes('name') || h.includes('athlete')),
            nation: headers.findIndex(h => h.includes('nat') || h.includes('country')),
            result: headers.findIndex(h => h.includes('result') || h.includes('time') || h.includes('performance') || h.includes('mark')),
          };
          if (colPos.name === -1 || colPos.result === -1) continue;

          // Determine title, optionally filter by eventNameFilter
          const title = nearestTitle(table);
          if (eventNameFilter && !title.toLowerCase().includes(eventNameFilter)) continue;

          const rows = Array.from(table.querySelectorAll('tbody tr'));
          let posCounter = 1;
          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll('td'));
            if (!cells.length) continue;
            const name = text(cells[colPos.name]);
            const country = colPos.nation !== -1 ? text(cells[colPos.nation]).slice(0, 4).toUpperCase() : 'UNK';
            let resultText = text(cells[colPos.result]);
            if (!name || !resultText) continue;
            // ignore DNS/DNF/DQ rows without numeric time
            if (/^(dns|dnf|dq)/i.test(resultText)) continue;
            const m = resultText.match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
            if (!m) continue;
            resultText = m[0];

            let rank = colPos.rank !== -1 ? parseInt(text(cells[colPos.rank]), 10) : NaN;
            if (!Number.isFinite(rank)) rank = posCounter;
            posCounter++;

            parsed.push({
              meetingTitle,
              venue,
              dateStr,
              title,
              name,
              country,
              resultText,
              rank,
            });
          }
        }
        return parsed;
      }, eventNameFilter);

      // Map scraped rows into our standardized result structure
      for (const r of scraped) {
        const gender = this.parseGender(r.title);
        const distance = this.parseDistance(r.title);
        const raceName = `${r.meetingTitle} - ${r.title}`;
        let date = new Date();
        if (r.dateStr) {
          const d = new Date(r.dateStr);
          if (!isNaN(d.getTime())) date = d;
        }

        results.push({
          athlete: { name: r.name, country: r.country, gender },
          race: { name: raceName, location: r.venue || 'International Venue', date, distance, distanceUnit: distance >= 1000 ? 'm' : 'm', category: 'Track', gender, isElite: true },
          result: { time: this.convertTimeToSeconds(r.resultText), position: r.rank, formattedTime: r.resultText },
        });
      }

      return results;
    } catch (e) {
      console.error('diamondLeagueDynamic error:', e);
      return results;
    } finally {
      try { if (browser) await browser.close(); } catch (_) {}
    }
  }
}

module.exports = new DiamondLeagueDynamic();
