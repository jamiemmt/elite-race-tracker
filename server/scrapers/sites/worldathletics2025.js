const BaseScraper = require('../BaseScraper');
const axios = require('axios');
const renderService = require('../../services/renderService');

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

  async fetchHtmlSmart(url, useProxyRender = false) {
    // Try direct fetch first
    try {
      const html = await this.fetchHtml(url);
      // If content appears non-empty, return
      if (html && html.length > 2000) return html;
      // If very small and proxy requested, fall through to proxy
    } catch (e) {
      // If blocked and proxy requested, try proxy
      if (!useProxyRender) throw e;
    }

    if (!useProxyRender) {
      // Return empty string to indicate failure without proxy
      return '';
    }

    // Try headless render first (preferred for official sources)
    try {
      const absolute = this.absoluteUrl(url);
      const html = await renderService.renderToHtml(absolute, { waitSelector: 'table, .results, .results-table' });
      if (html && html.length > 2000) {
        return html;
      }
    } catch (eHeadless) {
      console.warn('Headless render failed, falling back to proxy:', eHeadless.message);
    }

    // Fallback via r.jina.ai (readability proxy for dynamic sites)
    try {
      const absolute = this.absoluteUrl(url);
      const proxyUrl = `https://r.jina.ai/http://${absolute.replace(/^https?:\/\//, '')}`;
      const { data } = await axios.get(proxyUrl, {
        timeout: 30000,
        headers: { 'User-Agent': 'Elite Race Tracker/1.0 (https://eliteracetracker.com)' },
      });
      return data || '';
    } catch (e2) {
      console.warn('fetchHtmlSmart proxy fetch failed:', e2.message);
      return '';
    }
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

  async getResults(eventUrl, useProxyRender = false) {
    try {
      const html = await this.fetchHtmlSmart(eventUrl, useProxyRender);
      const $ = this.parseHtml(html);
      const eventInfo = this.parseEventInfo($);
      let results = [];

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

      // If no results were parsed from static table, try Next.js embedded JSON
      if (results.length === 0) {
        let nextData = this.extractNextData(html);
        if (!nextData && useProxyRender) {
          nextData = await this.fetchNextDataSmart(eventUrl, useProxyRender);
        }
        if (nextData) {
          const jsonResults = this.extractResultsFromNextData(nextData, eventInfo);
          if (jsonResults && jsonResults.length) results = jsonResults;
        }
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

  async fetchDiamondLeagueMeetings(season = 2025, useProxyRender = false) {
    try {
      const path = `/competitions/diamond-league/calendar-results?season=${encodeURIComponent(season)}`;
      const html = await this.fetchHtmlSmart(path, useProxyRender);
      const $ = this.parseHtml(html);
      const meetings = new Set();
      $('a[href*="/competitions/diamond-league/calendar-results/"]').each((_, a) => {
        const href = $(a).attr('href') || '';
        if (/\/competitions\/diamond-league\/calendar-results\/\d+\/result/.test(href)) {
          meetings.add(this.absoluteUrl(href));
        }
      });
      // Also search in Next.js JSON in case links are not rendered server-side
      let nextData = this.extractNextData(html);
      if (!nextData && useProxyRender) {
        nextData = await this.fetchNextDataSmart(path, useProxyRender);
      }
      if (nextData) {
        const str = JSON.stringify(nextData);
        const re = /"(\/competitions\/diamond-league\/calendar-results\/[0-9]+\/result)"/g;
        let m;
        while ((m = re.exec(str)) !== null) {
          meetings.add(this.absoluteUrl(m[1]));
        }
      }
      return Array.from(meetings);
    } catch (e) {
      console.error('fetchDiamondLeagueMeetings error:', e.message);
      return [];
    }
  }

  async extractEventResultLinksFromMeeting(meetingUrl, useProxyRender = false) {
    try {
      const html = await this.fetchHtmlSmart(meetingUrl, useProxyRender);
      const $ = this.parseHtml(html);
      const links = new Set();
      // Heuristics: look for links that navigate to discipline results
      $('a').each((_, a) => {
        const href = $(a).attr('href') || '';
        const text = ($(a).text() || '').toLowerCase();
        const looksLikeResultPath = /\/(result|results)\b/i.test(href) || /calendar-results\/\d+\/result/i.test(href);
        if (/results|final|heats|semi|qualification/.test(text) || looksLikeResultPath) {
          if (/metres|100|200|400|800|1500|3000|5000|10000|hurdles|steeple/i.test(href + ' ' + text)) {
            links.add(this.absoluteUrl(href));
          }
        }
      });
      // Also pull candidate links from Next.js JSON
      let nextData = this.extractNextData(html);
      if (!nextData && useProxyRender) {
        nextData = await this.fetchNextDataSmart(meetingUrl, useProxyRender);
      }
      if (nextData) {
        const collect = (obj) => {
          if (!obj) return;
          if (typeof obj === 'string') {
            const looksLikeResultPath = /\/(result|results)\b/i.test(obj) || /calendar-results\/\d+\/result/i.test(obj);
            if (looksLikeResultPath && /metres|100|200|400|800|1500|3000|5000|10000|hurdles|steeple/i.test(obj)) {
              links.add(this.absoluteUrl(obj));
            }
            return;
          }
          if (Array.isArray(obj)) {
            obj.forEach(collect);
            return;
          }
          if (typeof obj === 'object') {
            for (const k of Object.keys(obj)) collect(obj[k]);
          }
        };
        collect(nextData);
      }
      return Array.from(links);
    } catch (e) {
      console.error('extractEventResultLinksFromMeeting error:', e.message);
      return [];
    }
  }

  extractNextData(html) {
    try {
      const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/);
      if (m && m[1]) {
        return JSON.parse(m[1]);
      }
      // Fallback: any script with application/json containing pageProps
      const m2 = html.match(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?pageProps[\s\S]*?)<\/script>/);
      if (m2 && m2[1]) {
        return JSON.parse(m2[1]);
      }
    } catch (e) {
      console.warn('extractNextData failed:', e.message);
    }
    return null;
  }

  extractResultsFromNextData(nextData, eventInfoFallback) {
    const results = [];
    try {
      // Flatten search: collect arrays that look like result rows
      const candidates = [];
      const stack = [nextData];
      while (stack.length) {
        const node = stack.pop();
        if (!node) continue;
        if (Array.isArray(node)) {
          if (node.length > 0 && this.looksLikeResultArray(node)) candidates.push(node);
          for (const item of node) stack.push(item);
        } else if (typeof node === 'object') {
          for (const k of Object.keys(node)) stack.push(node[k]);
        }
      }

      // Use the largest plausible candidate
      let best = null;
      for (const arr of candidates) {
        if (!best || arr.length > best.length) best = arr;
      }
      if (!best) return [];

      // Try to infer event metadata from siblings in JSON string
      const jsonStr = JSON.stringify(nextData);
      const titleMatch = jsonStr.match(/\"event\"\s*:\s*\"([^\"]+)\"/i) || jsonStr.match(/\"discipline\"\s*:\s*\"([^\"]+)\"/i);
      const eventName = titleMatch ? titleMatch[1] : '';
      const gender = /women/i.test(eventName) ? 'Female' : (/men/i.test(eventName) ? 'Male' : (eventInfoFallback.gender || 'Mixed'));
      const distance = this.parseDistance(eventName) || eventInfoFallback.distance || 0;
      const raceInfo = {
        ...(eventInfoFallback || {}),
        name: eventInfoFallback?.name || eventName || 'World Athletics Event',
        gender,
        distance,
        distanceUnit: this.getDistanceUnit(distance),
        category: 'Track',
      };

      let pos = 1;
      for (const row of best) {
        const mapped = this.mapResultRow(row, pos, raceInfo.gender);
        if (mapped) {
          results.push({
            position: mapped.position,
            athlete: { name: mapped.name, country: mapped.country, gender: raceInfo.gender },
            race: { ...raceInfo },
            formattedTime: mapped.formattedTime,
            finishTime: this.convertTimeToSeconds(mapped.formattedTime),
          });
          pos++;
        }
      }
    } catch (e) {
      console.warn('extractResultsFromNextData failed:', e.message);
    }
    return results;
  }

  looksLikeResultArray(arr) {
    try {
      const a = arr[0];
      if (!a) return false;
      const s = JSON.stringify(a).toLowerCase();
      // look for keys typically present in WA results JSON
      return /place|rank|position/.test(s) && /(mark|time|result)/.test(s) && /(athlete|competitor|name|surname)/.test(s);
    } catch (_) { return false; }
  }

  mapResultRow(row, defaultPosition, gender) {
    try {
      // Try multiple shapes
      const obj = row || {};
      let position = obj.place || obj.rank || obj.position || defaultPosition;
      let formattedTime = obj.mark || obj.time || obj.result || obj.performance || '';
      let name = '';
      let country = obj.country || obj.nationality || (obj.competitor && (obj.competitor.country || obj.competitor.nationality)) || 'UNK';

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

      // Extract numeric time from strings like "9.81 (WL)" or "3:30.12 NR"
      if (formattedTime && typeof formattedTime === 'string') {
        const m = formattedTime.match(/(\d+:)?\d+(:\d+)?(?:\.\d+)?/);
        if (m) formattedTime = m[0];
      }

      if (!name || !formattedTime) return null;
      return { position: Number(position) || defaultPosition, name, country, formattedTime };
    } catch (_) { return null; }
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
    const { competitionUrl, eventUrls = [], diamondLeague = false, season = 2025, meetingLimit = 4, allowSample = false, useProxyRender = true } = options;
    try {
      // If specific event URLs provided, scrape them directly
      if (Array.isArray(eventUrls) && eventUrls.length > 0) {
        let all = [];
        for (const url of eventUrls) {
          const res = await this.getResults(url, useProxyRender);
          all.push(...res);
        }
        return all;
      }

      // If instructed to crawl Diamond League season
      if (diamondLeague) {
        const meetings = await this.fetchDiamondLeagueMeetings(season, useProxyRender);
        const pick = meetings.slice(0, Math.max(1, meetingLimit));
        let all = [];
        for (const m of pick) {
          const eventLinks = await this.extractEventResultLinksFromMeeting(m, useProxyRender);
          for (const ev of eventLinks) {
            const res = await this.getResults(ev, useProxyRender);
            all.push(...res);
          }
        }
        return all;
      }

      // If a specific competition URL is provided, try to detect event links minimally
      if (competitionUrl) {
        const eventLinks = await this.extractEventResultLinksFromMeeting(competitionUrl, useProxyRender);
        let all = [];
        for (const u of eventLinks) {
          const res = await this.getResults(u, useProxyRender);
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
