const BaseScraper = require('../BaseScraper');

/**
 * World Athletics 2025 scraper (Diamond League + WA Championships ready)
 * - Can scrape specific competition/event pages when URLs are provided
 * - Falls back to robust sample data for development
 */
class WorldAthletics2025 extends BaseScraper {
  constructor() {
    super('worldathletics2025', 'https://worldathletics.org');
    this.resultsBaseUrl = '/competitions/';
  }

  parseGender(eventName) {
    if (!eventName) return 'Mixed';
    const s = eventName.toLowerCase();
    if (s.includes("women") || s.includes("women's") || s.includes('female')) return 'Female';
    if (s.includes("men") || s.includes("men's") || s.includes('male')) return 'Male';
    return 'Mixed';
  }

  parseDistance(eventName) {
    if (!eventName) return 5000;
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
    if (lower.includes('800 ')) return 800;
    if (lower.includes('400 ')) return 400;
    if (lower.includes('200 ')) return 200;
    if (lower.includes('100 ')) return 100;
    return 5000;
  }

  getDistanceUnit(distance) {
    // Track events should generally use meters
    return 'm';
  }

  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const clean = timeStr.replace(/[^0-9:\.]/g, '');
    const parts = clean.split(':');
    if (parts.length === 3) return (+parts[0]) * 3600 + (+parts[1]) * 60 + parseFloat(parts[2]);
    if (parts.length === 2) return (+parts[0]) * 60 + parseFloat(parts[1]);
    return parseFloat(parts[0] || '0');
  }

  createRaceName(competitionName, eventName, gender) {
    let raceName = competitionName || 'World Athletics Competition';
    if (eventName && eventName !== competitionName) raceName += ` - ${eventName}`;
    const lr = raceName.toLowerCase();
    if (gender === 'Male' && !lr.includes("men")) raceName += " - Men's Division";
    else if (gender === 'Female' && !lr.includes("women")) raceName += " - Women's Division";
    else if (gender === 'Mixed' && !lr.includes('mixed')) raceName += ' - Mixed Division';
    return raceName;
  }

  parseEventInfo($) {
    const titleSelectors = ['.event-header__title','.competition-name','.event-name','h1','.page-title','.header-title'];
    let name = '';
    for (const sel of titleSelectors) { const t = $(sel).text().trim(); if (t) { name = t; break; } }
    if (!name) name = 'World Athletics Competition';

    const locationSelectors = ['.event-header__location','.location','.venue','.competition-venue','.event-venue'];
    let location = '';
    for (const sel of locationSelectors) { const t = $(sel).text().trim(); if (t) { location = t; break; } }
    if (!location) location = 'International Venue';

    const dateSelectors = ['.event-header__date','.date','.competition-date','.event-date','time'];
    let dateText = '';
    for (const sel of dateSelectors) { const t = $(sel).text().trim(); if (t) { dateText = t; break; } }
    let date = new Date();
    try {
      if (dateText) {
        const tryDate = new Date(dateText);
        if (!isNaN(tryDate.getTime())) date = tryDate;
      }
    } catch(_) {}

    const eventNameSelectors = ['.event-title','.discipline','.event-discipline','h2','.subtitle'];
    let eventName = '';
    for (const sel of eventNameSelectors) { const t = $(sel).text().trim(); if (t) { eventName = t; break; } }
    if (!eventName) eventName = '5000m';

    const gender = this.parseGender(eventName);
    const distance = this.parseDistance(eventName);

    return {
      name: this.createRaceName(name, eventName, gender),
      location,
      date,
      distance,
      distanceUnit: this.getDistanceUnit(distance),
      category: 'Track',
      gender,
      isElite: true,
    };
  }

  async getResults(eventUrl) {
    try {
      const html = await this.fetchHtml(eventUrl);
      const $ = this.parseHtml(html);
      const eventInfo = this.parseEventInfo($);
      const results = [];

      const tableSelectors = [
        '.results-table tbody tr',
        'table.results tbody tr',
        'table.athletes-results tbody tr',
        '.results-list tbody tr',
        '.event-results tbody tr',
        '.results__table tbody tr'
      ];

      for (const selector of tableSelectors) {
        let found = false;
        $(selector).each((i, el) => {
          found = true;
          const $el = $(el);

          const posSel = ['td:nth-child(1)', '.position', '.rank'];
          let position = null;
          for (const s of posSel) { const t = $el.find(s).text().trim(); if (t && !isNaN(parseInt(t))) { position = parseInt(t); break; } }

          const nameSel = ['td:nth-child(2)', '.athlete', '.name', '.athlete-name', 'a[href*="athlete"]'];
          let name = null;
          for (const s of nameSel) { const t = $el.find(s).text().trim(); if (t && t.length > 2) { name = t; break; } }
          if (!name) return;

          const countrySel = ['td:nth-child(3)', '.country', '.nation', '.nationality'];
          let country = null;
          for (const s of countrySel) { const t = $el.find(s).text().trim(); if (t && t.length >= 2 && t.length <= 4) { country = t; break; } }

          const timeSel = ['td:nth-child(4)','td:nth-child(5)', '.result', '.time', '.performance'];
          let formattedTime = null;
          for (const s of timeSel) { const t = $el.find(s).text().trim(); if (t && (t.includes(':') || /\d+\.\d+/.test(t))) { formattedTime = t; break; } }
          if (!formattedTime) return;

          results.push({
            position: position || i + 1,
            athlete: { name, country, gender: eventInfo.gender },
            race: { ...eventInfo },
            formattedTime,
            finishTime: this.convertTimeToSeconds(formattedTime)
          });
        });
        if (found && results.length > 0) break;
      }

      return results;
    } catch (e) {
      console.error('getResults error:', e.message);
      return [];
    }
  }

  absoluteUrl(u) {
    if (!u) return null;
    return u.startsWith('http') ? u : `${this.baseUrl}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  async fetchDiamondLeagueMeetings(season = 2025) {
    try {
      const path = `/competitions/diamond-league/calendar-results?season=${encodeURIComponent(season)}`;
      const html = await this.fetchHtml(path);
      const $ = this.parseHtml(html);
      const meetings = new Set();
      $('a[href*="/competitions/diamond-league/calendar-results/"]').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (/\/competitions\/diamond-league\/calendar-results\/\d+\/result/.test(href)) {
          meetings.add(this.absoluteUrl(href));
        }
      });
      return Array.from(meetings);
    } catch (e) {
      console.error('fetchDiamondLeagueMeetings error:', e.message);
      return [];
    }
  }

  async extractEventResultLinksFromMeeting(meetingUrl) {
    try {
      const html = await this.fetchHtml(meetingUrl);
      const $ = this.parseHtml(html);
      const links = new Set();
      // Heuristics: look for links that navigate to discipline results
      $('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        const text = ($(a).text() || '').toLowerCase();
        if (/results|final|heats|semi|qualification/.test(text) || /\/results\//i.test(href)) {
          if (/metres|100|200|400|800|1500|3000|5000|10000|hurdles|steeple/i.test(href + ' ' + text)) {
            links.add(this.absoluteUrl(href));
          }
        }
      });
      return Array.from(links);
    } catch (e) {
      console.error('extractEventResultLinksFromMeeting error:', e.message);
      return [];
    }
  }

  generateSampleData(limit = 40) {
    const competitions = [
      { name: 'World Athletics Championships 2025', location: 'Tokyo, Japan', date: new Date('2025-09-13') },
      { name: 'Diamond League Final 2025', location: 'Eugene, USA', date: new Date('2025-09-05') },
    ];
    const events = [
      { name: "Men's 100m", gender: 'Male', distance: 100 },
      { name: "Women's 100m", gender: 'Female', distance: 100 },
      { name: "Men's 5000m", gender: 'Male', distance: 5000 },
      { name: "Women's 5000m", gender: 'Female', distance: 5000 },
    ];
    const sampleAthletes = {
      Male: [
        { name: 'Noah Lyles', country: 'USA', times: { 100: '9.81', 5000: '13:25.00' } },
        { name: 'Jakob Ingebrigtsen', country: 'NOR', times: { 100: '10.30', 5000: '13:01.60' } },
        { name: 'Grant Fisher', country: 'USA', times: { 100: '10.50', 5000: '13:05.20' } },
      ],
      Female: [
        { name: 'Sha’Carri Richardson', country: 'USA', times: { 100: '10.65', 5000: '15:30.00' } },
        { name: 'Faith Kipyegon', country: 'KEN', times: { 100: '11.20', 5000: '14:31.00' } },
        { name: 'Sifan Hassan', country: 'NED', times: { 100: '11.40', 5000: '14:43.22' } },
      ]
    };
    const results = [];
    for (const comp of competitions) {
      for (const ev of events) {
        const athletes = sampleAthletes[ev.gender];
        const raceName = this.createRaceName(comp.name, ev.name, ev.gender);
        athletes.forEach((ath, idx) => {
          const t = ath.times[ev.distance] || '0:00.00';
          results.push({
            athlete: { name: ath.name, country: ath.country, gender: ev.gender },
            race: { name: raceName, date: comp.date, distance: ev.distance, distanceUnit: this.getDistanceUnit(ev.distance), location: comp.location, category: 'Track', gender: ev.gender, isElite: true },
            result: { time: this.convertTimeToSeconds(t), position: idx + 1, formattedTime: t }
          });
        });
      }
    }
    return results.slice(0, limit);
  }

  async scrape(options = {}) {
    const { competitionUrl, eventUrls = [], diamondLeague = false, season = 2025, meetingLimit = 4, allowSample = false } = options;
    try {
      // If specific event URLs provided, scrape them directly
      if (Array.isArray(eventUrls) && eventUrls.length > 0) {
        let all = [];
        for (const url of eventUrls) {
          const res = await this.getResults(url);
          all.push(...res);
        }
        return all;
      }

      // If instructed to crawl Diamond League season
      if (diamondLeague) {
        const meetings = await this.fetchDiamondLeagueMeetings(season);
        const pick = meetings.slice(0, Math.max(1, meetingLimit));
        let all = [];
        for (const m of pick) {
          const eventLinks = await this.extractEventResultLinksFromMeeting(m);
          for (const ev of eventLinks) {
            const res = await this.getResults(ev);
            all.push(...res);
          }
        }
        return all;
      }

      // If a specific competition URL is provided, try to detect event links minimally
      if (competitionUrl) {
        const eventLinks = await this.extractEventResultLinksFromMeeting(competitionUrl);
        let all = [];
        for (const u of eventLinks) {
          const res = await this.getResults(u);
          all.push(...res);
        }
        return all;
      }

      // No inputs: return empty or sample per flag
      return allowSample ? this.generateSampleData(40) : [];
    } catch (e) {
      console.error('WorldAthletics2025 scrape error:', e.message);
      return allowSample ? this.generateSampleData(20) : [];
    }
  }
}

module.exports = new WorldAthletics2025();
