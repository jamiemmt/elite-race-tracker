const BaseScraper = require('../BaseScraper');

/**
 * Scraper for official Diamond League Results & Standings site
 * Example root: https://www.diamondleague.com/results-standings/results/?season=2025
 * This site is likely client-rendered (Nuxt). We attempt to parse embedded window.__NUXT__ JSON
 * to extract meetings, disciplines and result rows. Heuristics are used to map fields.
 */
class DiamondLeagueCom extends BaseScraper {
  constructor() {
    super('diamondLeagueCom', 'https://www.diamondleague.com');
  }

  parseGender(name) {
    if (!name) return 'Mixed';
    const s = name.toLowerCase();
    if (s.includes('women')) return 'Female';
    if (s.includes('men')) return 'Male';
    return 'Mixed';
  }

  parseDistance(eventName) {
    if (!eventName) return 0;
    const m = eventName.match(/(\d+)\s*(m|km|miles?)/i);
    if (m) {
      const v = parseFloat(m[1]);
      const u = (m[2] || 'm').toLowerCase();
      if (u === 'km') return v * 1000;
      if (u.startsWith('mile')) return Math.round(v * 1609.34);
      return v;
    }
    const s = eventName.toLowerCase();
    if (s.includes('marathon') && !s.includes('half')) return 42195;
    if (s.includes('half marathon')) return 21097.5;
    if (s.includes('10000') || s.includes('10k')) return 10000;
    if (s.includes('5000') || s.includes('5k')) return 5000;
    if (s.includes('1500')) return 1500;
    if (s.includes('800')) return 800;
    if (s.includes('400')) return 400;
    if (s.includes('200')) return 200;
    if (s.includes('100')) return 100;
    return 0;
  }

  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const clean = timeStr.replace(/[^0-9:\.]/g, '');
    const parts = clean.split(':');
    if (parts.length === 3) return (+parts[0]) * 3600 + (+parts[1]) * 60 + parseFloat(parts[2]);
    if (parts.length === 2) return (+parts[0]) * 60 + parseFloat(parts[1]);
    return parseFloat(parts[0] || '0');
  }

  extractNuxtState(html) {
    try {
      const m = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/);
      if (m && m[1]) return JSON.parse(m[1]);
    } catch (e) {
      console.warn('extractNuxtState failed:', e.message);
    }
    return null;
  }

  looksLikeResultArray(arr) {
    try {
      const a = arr[0];
      if (!a) return false;
      const s = JSON.stringify(a).toLowerCase();
      return /place|rank|position/.test(s) && /(result|time|mark|perf|performance)/.test(s) && /(athlete|competitor|name|surname)/.test(s);
    } catch (_) { return false; }
  }

  mapRowToResult(row, defaultPosition, raceInfo) {
    try {
      const obj = row || {};
      const gender = raceInfo.gender || 'Mixed';
      let position = obj.place || obj.rank || obj.position || defaultPosition;
      let formattedTime = obj.result || obj.time || obj.mark || obj.performance || '';
      let name = '';
      let country = obj.country || obj.nationality || (obj.competitor && (obj.competitor.country || obj.competitor.nationality)) || 'UNK';

      // Name extraction heuristics
      if (obj.athlete) {
        if (typeof obj.athlete === 'string') name = obj.athlete;
        else if (obj.athlete.fullName) name = obj.athlete.fullName;
        else if (obj.athlete.name) name = obj.athlete.name;
        else if (obj.athlete.surname || obj.athlete.givenName) name = `${obj.athlete.givenName || ''} ${obj.athlete.surname || ''}`.trim();
      }
      if (!name && obj.competitor) {
        if (typeof obj.competitor === 'string') name = obj.competitor;
        else if (obj.competitor.fullName) name = obj.competitor.fullName;
        else if (obj.competitor.name) name = obj.competitor.name;
        else if (obj.competitor.surname || obj.competitor.givenName) name = `${obj.competitor.givenName || ''} ${obj.competitor.surname || ''}`.trim();
      }
      if (!name && obj.name) name = obj.name;

      if (formattedTime && typeof formattedTime === 'string') {
        const m = formattedTime.match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
        if (m) formattedTime = m[0];
      }

      if (!name || !formattedTime) return null;
      return {
        position: Number(position) || defaultPosition,
        athlete: { name, country, gender },
        race: { ...raceInfo },
        formattedTime,
        finishTime: this.convertTimeToSeconds(formattedTime),
      };
    } catch (_) { return null; }
  }

  absoluteUrl(u) {
    if (!u) return null;
    return u.startsWith('http') ? u : `${this.baseUrl}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  async scrape(options = {}) {
    const { season = 2025, topN } = options;
    try {
      const path = `/results-standings/results/?season=${encodeURIComponent(season)}`;
      const html = await this.fetchHtml(path);
      const nuxt = this.extractNuxtState(html);

      let results = [];
      if (nuxt) {
        // Traverse nuxt state to locate meetings, events and results-like arrays
        const stack = [nuxt];
        const candidateArrays = [];
        while (stack.length) {
          const node = stack.pop();
          if (!node) continue;
          if (Array.isArray(node)) {
            if (node.length > 0 && this.looksLikeResultArray(node)) candidateArrays.push(node);
            for (const it of node) stack.push(it);
          } else if (typeof node === 'object') {
            for (const k of Object.keys(node)) stack.push(node[k]);
          }
        }

        // Build minimal race info from nearest context strings
        const allStr = JSON.stringify(nuxt);
        const meetMatch = allStr.match(/\b([A-Z][A-Za-z]+\sDiamond League\b[^"\\]*)/); // e.g., Xiamen Diamond League
        const venueMatch = allStr.match(/\b([A-Za-z\-']+\s(Stadium|Arena|Letzigrund)[^"\\]*)/i);
        const dateMatch = allStr.match(/(\d{1,2}\s+[A-Z]{3}\s+20\d{2}|20\d{2}-\d{2}-\d{2})/);
        const meetingName = (meetMatch && meetMatch[1]) || 'Diamond League Meeting 2025';
        const venue = (venueMatch && venueMatch[1]) || '';
        const date = dateMatch ? new Date(dateMatch[0]) : new Date(`${season}-06-01`);

        // Attempt to infer discipline name from surrounding JSON; fallback per row
        let disciplineName = '';

        for (const arr of candidateArrays) {
          // Try to infer discipline from a nearby key in the stringified array
          const snippet = JSON.stringify(arr).toLowerCase();
          if (!disciplineName) {
            const d = (snippet.match(/(men\'s\s[^"\\]+|women\'s\s[^"\\]+)/) || [null, ''])[1];
            if (d) disciplineName = d.replace(/\\u2019|\'|’/g, "'");
          }

          const gender = this.parseGender(disciplineName);
          const distance = this.parseDistance(disciplineName);
          const raceInfo = {
            name: `${meetingName}${disciplineName ? ' - ' + disciplineName : ''}`,
            location: venue || 'Diamond League Venue',
            date,
            distance,
            distanceUnit: 'm',
            category: 'Track',
            gender,
            isElite: true,
          };

          let pos = 1;
          for (const row of arr) {
            const mapped = this.mapRowToResult(row, pos, raceInfo);
            if (mapped) {
              results.push(mapped);
              pos++;
            }
          }
        }
      }

      return results;
    } catch (e) {
      console.error('diamondLeagueCom scrape error:', e.message);
      return [];
    }
  }
}

module.exports = new DiamondLeagueCom();
