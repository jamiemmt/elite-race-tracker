const BaseScraper = require('../BaseScraper');
const axios = require('axios');
const pdfParse = require('pdf-parse');

/**
 * Diamond League PDF scraper
 * - Accepts one or more official Diamond League PDF URLs (Azure CDN)
 * - Extracts event blocks and parses athlete results
 *
 * Options:
 * - pdfUrls: string[] (required)
 * - events: string[] filter (e.g., ["Women 100m", "Women 200m"]) — case/diacritics/shorthand tolerant
 * - meetingName: string (optional)
 * - meetingLocation: string (optional)
 * - meetingDate: string | Date (optional)
 */
class DiamondLeaguePdf extends BaseScraper {
  constructor() {
    super('diamondLeaguePdf', 'https://ath-wdl-archive.azureedge.net');
  }

  fold(s) {
    return (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  }

  normEvent(s) {
    return this.fold(s).replace(/\b(\d+)m\b/g, '$1 metres');
  }

  parseDistance(title) {
    if (!title) return 0;
    const t = this.normEvent(title);
    const m = t.match(/(\d+)\s*(metres|m|km|miles?)/);
    if (m) {
      const v = parseFloat(m[1]);
      const u = (m[2] || 'metres');
      if (/km/i.test(u)) return v * 1000;
      if (/mile/i.test(u)) return Math.round(v * 1609.34);
      return v;
    }
    if (/10000|10k/.test(t)) return 10000;
    if (/5000|5k/.test(t)) return 5000;
    if (/3000/.test(t)) return 3000;
    if (/1500/.test(t)) return 1500;
    if (/800/.test(t)) return 800;
    if (/400/.test(t)) return 400;
    if (/200/.test(t)) return 200;
    if (/100/.test(t)) return 100;
    return 0;
  }

  parseGender(title) {
    const t = this.fold(title);
    if (/(women|woman|womens|women's)/i.test(t)) return 'Female';
    if (/(men|man|mens|men's)/i.test(t)) return 'Male';
    return 'Mixed';
  }

  isEventHeading(line) {
    const t = this.fold(line).replace(/\b(\d+)m\b/g, '$1 metres');
    return /(men|women)/.test(t) && /(metres|steeple|hurdles|relay|long|triple|high|pole|shot|discus|hammer|javelin)/.test(t);
  }

  matchEvent(line, filters) {
    if (!filters || filters.length === 0) return true;
    const t = this.normEvent(line);
    return filters.some(f => t.includes(this.normEvent(f)));
  }

  extractBlocks(text, filters) {
    const lines = text.split(/\r?\n/);
    const blocks = [];
    let cur = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (this.isEventHeading(line) && this.matchEvent(line, filters)) {
        if (cur) blocks.push(cur);
        cur = { title: line, rows: [] };
        continue;
      }
      if (cur) {
        // Stop on next heading unrelated to current filters
        if (this.isEventHeading(line) && !this.matchEvent(line, filters)) {
          blocks.push(cur); cur = null; continue;
        }
        cur.rows.push(line);
      }
    }
    if (cur) blocks.push(cur);
    return blocks;
  }

  parseResultsFromBlock(block) {
    const results = [];
    let posCounter = 1;

    for (const line of block.rows) {
      // Expect lines containing an athlete and a performance time/mark
      // Strategy: pick the last token that looks like a time/mark as formattedTime
      const tokens = line.split(/\s+/);
      const timeIdx = [...tokens].reverse().findIndex(tok => /(\d+:)?\d+(?::\d+)?(?:\.\d+)?/.test(tok));
      if (timeIdx === -1) continue;
      const idxFromStart = tokens.length - 1 - timeIdx;
      const formattedTime = tokens[idxFromStart];

      // Try to capture country as the 3-letter code just before time
      let country = 'UNK';
      if (idxFromStart - 1 >= 0 && /^[A-Z]{3}$/.test(tokens[idxFromStart - 1])) {
        country = tokens[idxFromStart - 1];
      }

      // Extract rank if present at start
      let rank = parseInt(tokens[0], 10);
      if (!Number.isFinite(rank)) rank = posCounter;

      // Athlete name is between first token(s) and country; heuristically join middle tokens
      const nameStart = Number.isFinite(parseInt(tokens[0], 10)) ? 1 : 0;
      const nameEnd = (idxFromStart - 1 >= nameStart) ? idxFromStart - 1 : idxFromStart;
      const name = tokens.slice(nameStart, nameEnd).join(' ').replace(/\s+/g, ' ').trim();
      if (!name || !formattedTime) continue;

      results.push({
        position: rank,
        athleteName: name,
        country,
        formattedTime
      });
      posCounter++;
    }
    return results;
  }

  async fetchPdfText(url) {
    const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
    const pdf = await pdfParse(Buffer.from(data));
    return pdf.text || '';
  }

  async scrape(options = {}) {
    const { pdfUrls = [], events = [], meetingName, meetingLocation, meetingDate } = options;
    if (!Array.isArray(pdfUrls) || pdfUrls.length === 0) return [];

    const filters = (events || []).map(e => this.normEvent(e));
    const all = [];

    for (const url of pdfUrls) {
      try {
        const text = await this.fetchPdfText(url);
        const blocks = this.extractBlocks(text, filters);
        for (const b of blocks) {
          const gender = this.parseGender(b.title);
          const distance = this.parseDistance(b.title);
          const raceInfo = {
            name: `${meetingName || 'Diamond League Meeting'} - ${b.title}`,
            location: meetingLocation || 'Diamond League Venue',
            date: meetingDate ? new Date(meetingDate) : new Date(),
            distance: distance || 0,
            distanceUnit: 'm',
            category: 'Track',
            gender,
            isElite: true,
          };
          const rows = this.parseResultsFromBlock(b);
          for (const r of rows) {
            all.push({
              position: r.position,
              athlete: { name: r.athleteName, country: r.country, gender },
              race: { ...raceInfo },
              formattedTime: r.formattedTime,
              finishTime: this.convertTimeToSeconds(r.formattedTime),
            });
          }
        }
      } catch (e) {
        console.warn('PDF scrape failed for', url, e.message);
      }
    }

    return all;
  }
}

module.exports = new DiamondLeaguePdf();
