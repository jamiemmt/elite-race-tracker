const BaseScraper = require('../BaseScraper');
const puppeteer = require('puppeteer');
const axios = require('axios');

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

  normalizeTimeStr(str) {
    if (!str) return null;
    const m = String(str).match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
    return m ? m[0] : null;
  }

  mapSwissRow(row) {
    const name = row?.Athlete?.FullName || row?.Athlete?.Name || row?.Competitor || row?.Name || '';
    const country = row?.Athlete?.Nat || row?.Nation || row?.Country || 'UNK';
    const position = row?.Rank || row?.Place || row?.Position || row?.Order || null;
    const perf = row?.Result || row?.Time || row?.Performance || row?.Mark || row?.Best || null;
    const formattedTime = this.normalizeTimeStr(perf);
    return { name, country, position, formattedTime };
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
    const directUrl = options.url || options.meetingPageUrl || '';
    const meetingQuery = (options.meeting || '').trim();
    const genderFilter = (options.gender || 'All').toLowerCase();
    const eventNameFilterRaw = (options.eventName || '').trim();
    // Normalize common shorthand like "100m" -> "100 metres"
    const eventNameFilter = eventNameFilterRaw
      .toLowerCase()
      .replace(/\b(\d+)m\b/g, '$1 metres')
      .trim();

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
      const captured = new Set();
      page.on('response', async (res) => {
        try {
          const url = res.url();
          if (/ps-cache\.web\.swisstiming\.com\/node\/db\//i.test(url) || /liveresults\.swisstiming/i.test(url)) {
            captured.add(url);
          }
        } catch (_) {}
      });
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36');

      const targetUrl = directUrl || `${this.resultsUrl}?season=${encodeURIComponent(String(season))}`;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // If we're on the SwissTiming site, give the SPA time to boot and fetch channels
      if (/liveresults\./i.test(targetUrl)) {
        try {
          await Promise.race([
            page.waitForResponse(r => /ps-cache\.web\.swisstiming\.com\/node\/db\//i.test(r.url()), { timeout: 15000 }),
            page.waitForTimeout(8000)
          ]);
        } catch (_) {}
      } else {
        // Otherwise, allow the DL site to settle
        await page.waitForTimeout(1500);
      }

      // Handle cookie consent (Complianz)
      try {
        await page.evaluate(() => {
          const tryClick = (sel) => {
            const el = document.querySelector(sel);
            if (el) { el.click(); return true; }
            return false;
          };
          // Common Complianz selectors
          if (tryClick('button.cmplz-accept')) return;
          if (tryClick('button[id*="cmplz-accept"]')) return;
          const btns = Array.from(document.querySelectorAll('button, a'));
          const accept = btns.find(b => /accept/i.test(b.textContent || ''));
          if (accept) accept.click();
        });
        await page.waitForTimeout(800);
      } catch (_) {}

      // If we are on the global results page (no direct URL), try to set meeting filter
      if (!directUrl && meetingQuery) {
        // Open the Meetings filter dropdown if collapsed, then set only the requested meeting
        const foundMeeting = await page.evaluate((mq) => {
          function text(el){return (el?.textContent||'').trim();}
          const fold = (s)=> (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
          const mfold = fold(mq);
          const root = document.querySelector('[data-select-type="meetings"]');
          if (!root) return false;
          const labels = Array.from(root.querySelectorAll('label'));
          let matched = false;
          labels.forEach(lbl => {
            const t = fold(text(lbl));
            const input = lbl.querySelector('input[type="checkbox"]');
            if (!input) return;
            if (t.includes(mfold)) {
              if (!input.checked) lbl.click();
              matched = true;
            } else {
              if (input.checked) lbl.click();
            }
          });
          // update visible summary button text if exists
          const btn = root.querySelector('[data-el="btn-base"]');
          if (btn && matched) btn.textContent = labels.find(l=>fold(text(l)).includes(mfold))?.textContent || btn.textContent;
          return matched;
        }, meetingQuery);
        if (foundMeeting) await page.waitForTimeout(3500);
      }

      // If gender filter requested, try clicking corresponding checkbox set
      if (!directUrl && (genderFilter === 'men' || genderFilter === 'women')) {
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

      // Try clicking specific event headings if provided (e.g., "100 metres")
      if (eventNameFilter) {
        try {
          await page.evaluate((filter) => {
            const fold = (s)=> (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
            const norm = (s)=> fold(s).replace(/\b(\d+)m\b/g,'$1 metres');
            const nodes = Array.from(document.querySelectorAll('a, button, h2, h3, .event-title, .discipline, summary'));
            for (const n of nodes) {
              const t = norm(n.textContent || '');
              if (t.includes(filter)) {
                // Click to expand/open
                if (n instanceof HTMLElement) n.click();
              }
            }
          }, eventNameFilter);
          await page.waitForTimeout(1500);
        } catch (_) {}
      }

      // Expand any collapsible event blocks by clicking toggles with text like 'Results'
      // Then parse all tables that look like results (with Rank/Name/Result headers)
      const scrapedMain = await page.evaluate((eventNameFilter) => {
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
          const normTitle = title.toLowerCase().replace(/\b(\d+)m\b/g,'$1 metres');
          if (eventNameFilter && !normTitle.includes(eventNameFilter)) continue;

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

      // If nothing found on main page, try collecting explicit 'Results' links near matching event titles and following them
      let scraped = scrapedMain;
      if ((!scraped || scraped.length === 0)) {
        try {
          const resultsLinks = await page.evaluate((eventNameFilter) => {
            const fold = (s)=> (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
            const norm = (s)=> fold(s).replace(/\b(\d+)m\b/g,'$1 metres');
            const links = [];
            // Scan blocks that contain a discipline title and a nearby 'Results' link
            const blocks = Array.from(document.querySelectorAll('section, article, div'));
            for (const b of blocks) {
              const titleEl = b.querySelector('h2, h3, .discipline, .event-title');
              const title = norm(titleEl?.textContent || '');
              if (!title) continue;
              if (eventNameFilter && !title.includes(eventNameFilter)) continue;
              const a = Array.from(b.querySelectorAll('a')).find(a=>/results/i.test(a.textContent||''));
              if (a && a.href) links.push({ title: titleEl?.textContent || '', href: a.href });
            }
            return links;
          }, eventNameFilter);
          for (const link of resultsLinks) {
            try {
              await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 60000 });
              // parse tables on the target page
              const sub = await page.evaluate(() => {
                const parsed = [];
                function text(el){return (el?.textContent||'').trim();}
                function nearestTitle(el){
                  let cur = el;
                  for (let i=0;i<8 && cur;i++){
                    const h = cur.querySelector?.('h2, h3, .event-title, .discipline') || cur.previousElementSibling;
                    if (h && text(h)) return text(h);
                    cur = cur.parentElement;
                  }
                  const alt = document.querySelector('h2, h3');
                  return alt ? text(alt) : document.title || 'Diamond League Event';
                }
                const meetingTitle = text(document.querySelector('.page-title, h1, title')) || document.title || 'Diamond League Meeting';
                const venue = text(document.querySelector('.venue, .location')) || '';
                const timeEl = document.querySelector('time');
                const dateStr = timeEl ? (timeEl.getAttribute('datetime') || text(timeEl)) : '';
                const tables = Array.from(document.querySelectorAll('table'));
                for (const table of tables){
                  const headers = Array.from(table.querySelectorAll('thead th, tbody tr:first-child th, tbody tr:first-child td')).map(th => text(th).toLowerCase());
                  if (!headers.length) continue;
                  const colPos = {
                    rank: headers.findIndex(h => h.includes('rank') || h === '#' || h.includes('pos')),
                    name: headers.findIndex(h => h.includes('name') || h.includes('athlete')),
                    nation: headers.findIndex(h => h.includes('nat') || h.includes('country')),
                    result: headers.findIndex(h => h.includes('result') || h.includes('time') || h.includes('performance') || h.includes('mark')),
                  };
                  if (colPos.name === -1 || colPos.result === -1) continue;
                  const title = nearestTitle(table);
                  const rows = Array.from(table.querySelectorAll('tbody tr'));
                  let posCounter = 1;
                  for (const row of rows){
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (!cells.length) continue;
                    const name = text(cells[colPos.name]);
                    const country = colPos.nation !== -1 ? text(cells[colPos.nation]).slice(0,4).toUpperCase() : 'UNK';
                    let resultText = text(cells[colPos.result]);
                    if (!name || !resultText) continue;
                    if (/^(dns|dnf|dq)/i.test(resultText)) continue;
                    const m = resultText.match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
                    if (!m) continue;
                    resultText = m[0];
                    let rank = colPos.rank !== -1 ? parseInt(text(cells[colPos.rank]),10) : NaN;
                    if (!Number.isFinite(rank)) rank = posCounter;
                    posCounter++;
                    parsed.push({ meetingTitle, venue, dateStr, title, name, country, resultText, rank });
                  }
                }
                return parsed;
              });
              if (sub && sub.length) {
                scraped = (scraped || []).concat(sub);
              }
            } catch (e) {
              // continue with next link
            }
          }
        } catch (_) {}
      }

      if ((!scraped || scraped.length === 0)) {
        try {
          const frames = page.frames();
          const live = frames.find(f => /liveresults|swisstiming/i.test(f.url()));
          if (live) {
            // try simple parse of tables inside iframe
            const inside = await live.evaluate((eventNameFilter) => {
              const parsed = [];
              function text(el){return (el?.textContent||'').trim();}
              function nearestTitle(el){
                let cur = el;
                for (let i=0;i<8 && cur;i++){
                  const h = cur.querySelector?.('h2, h3, .event-title, .discipline') || cur.previousElementSibling;
                  if (h && text(h)) return text(h);
                  cur = cur.parentElement;
                }
                const alt = document.querySelector('h2, h3');
                return alt ? text(alt) : 'Diamond League Event';
              }
              const meetingTitle = text(document.querySelector('.page-title, h1, title')) || 'Diamond League Meeting';
              const venue = text(document.querySelector('.venue, .location')) || '';
              const timeEl = document.querySelector('time');
              const dateStr = timeEl ? (timeEl.getAttribute('datetime') || text(timeEl)) : '';
              const normFilter = (eventNameFilter||'').toLowerCase();
              const tables = Array.from(document.querySelectorAll('table'));
              for (const table of tables){
                const headers = Array.from(table.querySelectorAll('thead th, tbody tr:first-child th, tbody tr:first-child td')).map(th => text(th).toLowerCase());
                if (!headers.length) continue;
                const colPos = {
                  rank: headers.findIndex(h => h.includes('rank') || h === '#' || h.includes('pos')),
                  name: headers.findIndex(h => h.includes('name') || h.includes('athlete')),
                  nation: headers.findIndex(h => h.includes('nat') || h.includes('country')),
                  result: headers.findIndex(h => h.includes('result') || h.includes('time') || h.includes('performance') || h.includes('mark')),
                };
                if (colPos.name === -1 || colPos.result === -1) continue;
                const title = nearestTitle(table);
                const normTitle = title.toLowerCase().replace(/\b(\d+)m\b/g,'$1 metres');
                if (normFilter && !normTitle.includes(normFilter)) continue;
                const rows = Array.from(table.querySelectorAll('tbody tr'));
                let posCounter = 1;
                for (const row of rows){
                  const cells = Array.from(row.querySelectorAll('td'));
                  if (!cells.length) continue;
                  const name = text(cells[colPos.name]);
                  const country = colPos.nation !== -1 ? text(cells[colPos.nation]).slice(0,4).toUpperCase() : 'UNK';
                  let resultText = text(cells[colPos.result]);
                  if (!name || !resultText) continue;
                  if (/^(dns|dnf|dq)/i.test(resultText)) continue;
                  const m = resultText.match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
                  if (!m) continue;
                  resultText = m[0];
                  let rank = colPos.rank !== -1 ? parseInt(text(cells[colPos.rank]),10) : NaN;
                  if (!Number.isFinite(rank)) rank = posCounter;
                  posCounter++;
                  parsed.push({ meetingTitle, venue, dateStr, title, name, country, resultText, rank });
                }
              }
              return parsed;
            }, eventNameFilter);
            scraped = inside || [];
          }
        } catch (e) {
          // ignore and proceed
        }
      }

      // If still nothing, try SwissTiming JSON endpoints captured via network
      if ((!scraped || scraped.length === 0) && captured.size) {
        try {
          const payloads = [];
          for (const url of Array.from(captured)) {
            if (/ps-cache\.web\.swisstiming\.com\/node\/db\//i.test(url)) {
              try {
                const { data } = await axios.get(url, { timeout: 20000, httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) });
                payloads.push(data);
              } catch (_) {}
            }
          }
          const filterStr = (eventNameFilter || '').toLowerCase();
          const found = [];
          const walk = (node) => {
            if (!node) return;
            if (Array.isArray(node)) {
              if (node.length && typeof node[0] === 'object') {
                const s = JSON.stringify(node[0]).toLowerCase();
                if (/(rank|place|position)/.test(s) && /(time|result|mark|performance|best)/.test(s)) {
                  // try to infer a title from sibling keys or parents (best effort)
                  node.forEach((row, idx) => {
                    const mapped = this.mapSwissRow(row);
                    if (!mapped.name || !mapped.formattedTime) return;
                    found.push({ mapped, idx });
                  });
                }
              }
              node.forEach(walk);
            } else if (typeof node === 'object') {
              for (const k of Object.keys(node)) walk(node[k]);
            }
          };
          payloads.forEach(walk);
          if (found.length) {
            let pos = 1;
            for (const { mapped } of found) {
              // crude filter: ensure eventNameFilter words are present in a nearby discipline name if available
              // Since we don't have the exact event title, simply proceed when a filter is set
              if (filterStr && !filterStr.split(/\s+/).every(w => w.length < 3 || JSON.stringify(mapped).toLowerCase().includes(w))) {
                continue;
              }
              const gender = genderFilter === 'women' ? 'Female' : genderFilter === 'men' ? 'Male' : 'Mixed';
              const title = eventNameFilterRaw || 'Event';
              const distance = this.parseDistance(title);
              const race = {
                name: `${meetingQuery || 'Diamond League Meeting'} - ${title}`,
                location: 'Diamond League Venue',
                date: new Date(),
                distance,
                distanceUnit: 'm',
                category: 'Track',
                gender,
                isElite: true,
              };
              const position = Number(mapped.position) || pos;
              scraped.push({
                position,
                athlete: { name: mapped.name, country: mapped.country, gender },
                race,
                formattedTime: mapped.formattedTime,
                finishTime: this.convertTimeToSeconds(mapped.formattedTime),
              });
              pos++;
            }
          }
        } catch (_) {}
      }

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
