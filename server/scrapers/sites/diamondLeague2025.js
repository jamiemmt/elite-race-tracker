const BaseScraper = require('../BaseScraper');
const cheerio = require('cheerio');

/**
 * Diamond League 2025 scraper targeting meeting pages like:
 *   - https://zurich.diamondleague.com/en/programme-results/
 *   - https://london.diamondleague.com/en/programme-results/
 * This scraper attempts to parse server-rendered tables for real results.
 */
class DiamondLeague2025 extends BaseScraper {
  constructor() {
    super('diamondLeague2025', 'https://www.diamondleague.com');
  }

  parseGender(eventName) {
    if (!eventName) return 'Mixed';
    const s = eventName.toLowerCase();
    if (s.includes('women') || s.includes("women's") || s.includes('female')) return 'Female';
    if (s.includes('men') || s.includes("men's") || s.includes('male')) return 'Male';
    return 'Mixed';
  }

  parseDistance(eventName) {
    if (!eventName) return 0;
    const lower = eventName.toLowerCase();
    const m = eventName.match(/(\d+)\s*(m|km|miles?)/i);
    if (m) {
      const v = parseFloat(m[1]);
      const u = m[2].toLowerCase();
      if (u === 'km') return v * 1000;
      if (u.startsWith('mile')) return Math.round(v * 1609.34);
      return v;
    }
    if (lower.includes('marathon') && !lower.includes('half')) return 42195;
    if (lower.includes('half marathon')) return 21097.5;
    if (lower.includes('10000') || lower.includes('10k')) return 10000;
    if (lower.includes('5000') || lower.includes('5k')) return 5000;
    if (lower.includes('1500')) return 1500;
    if (lower.includes('800')) return 800;
    if (lower.includes('400')) return 400;
    if (lower.includes('200')) return 200;
    if (lower.includes('100')) return 100;
    return 0;
  }

  getDistanceUnit(distance) { return 'm'; }

  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const clean = timeStr.replace(/[^0-9:\.]/g, '');
    const parts = clean.split(':');
    if (parts.length === 3) return (+parts[0]) * 3600 + (+parts[1]) * 60 + parseFloat(parts[2]);
    if (parts.length === 2) return (+parts[0]) * 60 + parseFloat(parts[1]);
    return parseFloat(parts[0] || '0');
  }

  absoluteUrl(u) {
    if (!u) return null;
    return u.startsWith('http') ? u : `${this.baseUrl}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  findEventTitleForTable($, table) {
    const t = $(table);
    const title = t.prevAll('h2,h3').first().text().trim()
      || t.closest('section,div').find('h2,h3').first().text().trim();
    return title || 'Diamond League Event';
  }

  extractMeetingDate($) {
    // Try common places: time tag, header text
    const dateText = $('time').first().attr('datetime') || $('time').first().text() || '';
    if (dateText) {
      const d = new Date(dateText);
      if (!isNaN(d.getTime())) return d;
    }
    // Fallback: current date
    return new Date();
  }

  parseResultsTable($, table, meetingName, meetingDate, venue) {
    const results = [];
    const $table = $(table);
    const headerCells = $table.find('thead th');
    let headers = [];
    if (headerCells.length > 0) {
      headerCells.each((_, th) => headers.push($(th).text().trim().toLowerCase()));
    } else {
      // sometimes first row is header
      const firstRow = $table.find('tr').first();
      firstRow.find('th,td').each((_, th) => headers.push($(th).text().trim().toLowerCase()));
    }
    const findCol = (names) => {
      for (let i = 0; i < headers.length; i++) {
        if (names.some(n => headers[i].includes(n))) return i;
      }
      return -1;
    };
    const posIdx = findCol(['pos','position','rank','#']);
    const nameIdx = findCol(['name','athlete','competitor']);
    const natIdx = findCol(['country','nation','nat','nationality']);
    const timeIdx = findCol(['time','result','performance','mark']);

    const eventTitle = this.findEventTitleForTable($, table);
    const gender = this.parseGender(eventTitle);
    const distance = this.parseDistance(eventTitle);

    const raceInfo = {
      name: `${meetingName} - ${eventTitle}`,
      location: venue || 'Diamond League Venue',
      date: meetingDate,
      distance: distance || 0,
      distanceUnit: this.getDistanceUnit(distance || 0),
      category: 'Track',
      gender,
      isElite: true,
    };

    $table.find('tbody tr').each((rowIdx, tr) => {
      const $tr = $(tr);
      const cells = $tr.find('td');
      if (cells.length === 0) return;

      const valAt = (idx) => idx >= 0 && idx < cells.length ? $(cells[idx]).text().replace(/\s+/g,' ').trim() : '';
      const positionText = valAt(posIdx) || (rowIdx + 1).toString();
      const athleteName = valAt(nameIdx);
      const country = (valAt(natIdx) || 'UNK').substring(0, 4).toUpperCase();
      let formattedTime = valAt(timeIdx);
      if (!formattedTime) return;

      // Skip non-finishers
      if (/^dnf|dns|dq/i.test(formattedTime)) return;

      // Extract numeric time/performance
      const m = formattedTime.match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
      if (m) formattedTime = m[0];

      if (!athleteName || !formattedTime) return;
      results.push({
        position: parseInt(positionText) || (rowIdx + 1),
        athlete: { name: athleteName, country, gender },
        race: { ...raceInfo },
        formattedTime,
        finishTime: this.convertTimeToSeconds(formattedTime),
      });
    });

    return results;
  }

  async scrape(options = {}) {
    const { meetingUrls = [], topN } = options;
    try {
      if (!Array.isArray(meetingUrls) || meetingUrls.length === 0) {
        return [];
      }
      let all = [];
      for (const url of meetingUrls) {
        const html = await this.fetchHtml(url);
        const $ = cheerio.load(html);
        const meetingName = $('title').first().text().trim() || 'Diamond League Meeting 2025';
        const meetingDate = this.extractMeetingDate($);
        const venue = $('[class*="venue"], .venue, .location').first().text().trim() || '';
        $('table').each((_, table) => {
          const res = this.parseResultsTable($, table, meetingName, meetingDate, venue);
          if (res && res.length) all.push(...res);
        });
      }
      return all;
    } catch (e) {
      console.error('DiamondLeague2025 scrape error:', e.message);
      return [];
    }
  }
}

module.exports = new DiamondLeague2025();
