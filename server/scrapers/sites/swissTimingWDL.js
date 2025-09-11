const BaseScraper = require('../BaseScraper');
const axios = require('axios');

/**
 * Swiss Timing Wanda Diamond League scraper (experimental)
 * - Targets the SwissTiming caching cluster used by Diamond League live results
 * - You must supply one or more event codes, e.g. ["Zurich_2025", "Xiamen_2025"].
 * - Default namespace is SPORTCODE_ENVIRONMENT (as used by the WDL SPA bundles)
 *
 * NOTE: Endpoint structure is inferred from the SPA bundle. Keys are tried heuristically.
 */
class SwissTimingWDL extends BaseScraper {
  constructor() {
    super('swissTimingWDL', 'https://ps-cache.web.swisstiming.com');
    this.cacheBase = 'https://ps-cache.web.swisstiming.com/node/db';
    this.defaultNamespace = 'SPORTCODE_ENVIRONMENT';
  }

  absoluteKey(namespace, key) {
    return `${namespace}|${key}`;
  }

  async fetchJson(namespace, key) {
    const full = `${this.cacheBase}/${encodeURIComponent(this.absoluteKey(namespace, key))}`;
    try {
      const { data } = await axios.get(full, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Elite Race Tracker/1.0 (https://eliteracetracker.com)'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      return data;
    } catch (e) {
      console.warn(`SwissTiming fetch failed for ${full}: ${e.response?.status || e.message}`);
      return null;
    }
  }

  parseGender(name) {
    if (!name) return 'Mixed';
    const s = name.toLowerCase();
    if (s.includes('women')) return 'Female';
    if (s.includes("men")) return 'Male';
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

  normalizeTimeStr(str) {
    if (!str) return null;
    const m = String(str).match(/(\d+:)?\d+(?::\d+)?(?:\.\d+)?/);
    return m ? m[0] : null;
  }

  mapResultRow(row) {
    // Try multiple shapes based on common SwissTiming payloads
    const name = row?.Athlete?.FullName || row?.Athlete?.Name || row?.Competitor || row?.Name || '';
    const country = row?.Athlete?.Nat || row?.Nation || row?.Country || 'UNK';
    const position = row?.Rank || row?.Place || row?.Position || row?.Order || null;
    const perf = row?.Result || row?.Time || row?.Performance || row?.Mark || row?.Best || null;
    const formattedTime = this.normalizeTimeStr(perf);
    return { name, country, position, formattedTime };
  }

  buildRaceInfo(eventMeta, meeting) {
    const gender = this.parseGender(eventMeta?.Name || eventMeta?.Discipline || eventMeta?.EventName);
    const distance = this.parseDistance(eventMeta?.Name || eventMeta?.Discipline || eventMeta?.EventName);
    return {
      name: `${meeting?.Name || meeting?.MeetingOrganiserName || meeting?.Title || 'Diamond League Meeting'} - ${eventMeta?.Name || eventMeta?.Discipline || eventMeta?.EventName || 'Event'}`,
      location: meeting?.Venue || meeting?.City || meeting?.Location || meeting?.Organiser || 'Diamond League Venue',
      date: meeting?.From ? new Date(meeting.From) : new Date(),
      distance,
      distanceUnit: 'm',
      category: 'Track',
      gender,
      isElite: true,
    };
  }

  // Attempt to read common keys for an event code
  async fetchEventPayloads(namespace, eventCode) {
    const keysToTry = [
      `${eventCode}_SCHEDULE_JSON`,
      `${eventCode}_STANDINGDATA_JSON`,
      `${eventCode}_COMPSTRUCT_JSON`,
      `${eventCode}_PARTICIPANTS_JSON`,
      `${eventCode}_CURRENTEVENT_JSON`,
      `${eventCode}_LIVE_JSON`,
      `${eventCode}_REPORT_STANDING_MEDALTABLE_JSON`,
      `${eventCode}_MEDALLISTBYEVENT_JSON`,
    ];
    const payloads = {};
    for (const key of keysToTry) {
      const data = await this.fetchJson(namespace, key);
      if (data) payloads[key] = data;
    }
    return payloads;
  }

  // Try to derive event result arrays from SwissTiming payloads
  extractResultsFromPayloads(payloads, meetingMeta = {}) {
    const results = [];
    const allJson = JSON.stringify(payloads);

    // Heuristic: collect arrays that contain result-like rows
    const candidates = [];
    const walk = (node) => {
      if (!node) return;
      if (Array.isArray(node)) {
        if (node.length && typeof node[0] === 'object') {
          const s = JSON.stringify(node[0]).toLowerCase();
          if (/(rank|place|position)/.test(s) && /(time|result|mark|performance|best)/.test(s)) {
            candidates.push(node);
          }
        }
        node.forEach(walk);
      } else if (typeof node === 'object') {
        for (const k of Object.keys(node)) walk(node[k]);
      }
    };
    walk(payloads);

    // Attempt to locate event metadata near candidates
    const getDisciplineName = (snippet) => {
      const m = snippet.match(/\b(Men\'s|Women\'s|Men|Women) [A-Za-z0-9 ]{2,30}/i);
      return m ? m[0].replace(/\\u2019|’/g, "'") : '';
    };

    const used = new Set();
    for (const arr of candidates) {
      const snippet = JSON.stringify(arr).toLowerCase();
      const eventNameGuess = getDisciplineName(snippet) || 'Event';
      const raceInfo = this.buildRaceInfo({ Name: eventNameGuess }, meetingMeta);

      let pos = 1;
      for (const row of arr) {
        const mapped = this.mapResultRow(row);
        if (!mapped?.name || !mapped?.formattedTime) continue;
        const position = Number(mapped.position) || pos;
        results.push({
          position,
          athlete: { name: mapped.name, country: mapped.country, gender: raceInfo.gender },
          race: { ...raceInfo },
          formattedTime: mapped.formattedTime,
          finishTime: this.convertTimeToSeconds(mapped.formattedTime),
        });
        pos++;
      }
    }
    return results;
  }

  async scrape(options = {}) {
    const { eventCodes = [], namespace = this.defaultNamespace } = options;
    if (!Array.isArray(eventCodes) || eventCodes.length === 0) {
      console.warn('SwissTimingWDL: please supply options.eventCodes e.g. ["Zurich_2025"]');
      return [];
    }

    const all = [];
    for (const code of eventCodes) {
      try {
        const payloads = await this.fetchEventPayloads(namespace, code);
        const meetingMeta = payloads?.[`${code}_CURRENTEVENT_JSON`] || payloads?.[`${code}_STANDINGDATA_JSON`] || {};
        const results = this.extractResultsFromPayloads(payloads, meetingMeta);
        all.push(...results);
      } catch (e) {
        console.error(`SwissTimingWDL scrape failed for ${code}:`, e.message);
      }
    }
    return all;
  }
}

module.exports = new SwissTimingWDL();
