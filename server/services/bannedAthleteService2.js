/**
 * Service for managing banned athlete detection and updates
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const axios = require('axios');
const cheerio = require('cheerio');

// Lightweight in-memory cache shared across service instances
const AIU_FETCH_CACHE = { key: null, ts: 0, ttl: 180000, data: null };

class BannedAthleteService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.aiuPdfUrl = 'https://www.athleticsintegrity.org/downloads/pdfs/disciplinary-process/en/Global-List-AUG_25.pdf';
    this.aiuProvisionalUrl = 'https://www.athleticsintegrity.org/disciplinary-process/provisional-suspensions-in-force';
    this.aiuFirstInstanceUrl = 'https://www.athleticsintegrity.org/disciplinary-process/first-instance-decisions';
    
    // Known banned athletes from Olympic medal stripping and major doping cases
    this.knownBannedAthletes = [
      // Russian state-sponsored doping program athletes
      { name: 'Mariya Savinova', country: 'RUS', reason: 'Olympic 800m gold stripped (2012)', source: 'WADA/IOC', agency: 'WADA', banType: 'Doping violation', dateDetected: '2015' },
      { name: 'Ekaterina Poistogova', country: 'RUS', reason: 'Olympic 800m bronze stripped (2012)', source: 'WADA/IOC', agency: 'WADA', banType: 'Doping violation', dateDetected: '2015' },
      { name: 'Yulia Stepanova', country: 'RUS', reason: 'Whistleblower, previously banned', source: 'RUSADA/WADA', agency: 'RUSADA', banType: 'Doping violation', dateDetected: '2013' },
      { name: 'Liliya Shobukhova', country: 'RUS', reason: 'Marathon results annulled', source: 'IAAF/AIU', agency: 'AIU', banType: 'Biological passport', dateDetected: '2014' },
      
      // BALCO scandal athletes
      { name: 'Marion Jones', country: 'USA', reason: 'Olympic medals stripped (2000)', source: 'USADA/IOC', agency: 'USADA', banType: 'Steroid use', dateDetected: '2007' },
      { name: 'Tim Montgomery', country: 'USA', reason: 'World record annulled', source: 'USADA', agency: 'USADA', banType: 'BALCO scandal', dateDetected: '2005' },
      
      // Other major cases
      { name: 'Ben Johnson', country: 'CAN', reason: 'Olympic 100m gold stripped (1988)', source: 'IOC/IAAF', agency: 'IOC', banType: 'Stanozolol', dateDetected: '1988' },
      { name: 'Justin Gatlin', country: 'USA', reason: 'Previously banned, returned', source: 'USADA', agency: 'USADA', banType: 'Testosterone', dateDetected: '2006' },
      { name: 'Tyson Gay', country: 'USA', reason: 'Previously banned, returned', source: 'USADA', agency: 'USADA', banType: 'Steroid use', dateDetected: '2013' },
      { name: 'Rita Jeptoo', country: 'KEN', reason: 'Boston/Chicago Marathon wins stripped', source: 'AIU/ADAK', agency: 'AIU', banType: 'EPO', dateDetected: '2014' },
      { name: 'Jemima Sumgong', country: 'KEN', reason: 'Olympic marathon gold, banned', source: 'AIU/ADAK', agency: 'AIU', banType: 'EPO', dateDetected: '2017' },
      
      // Recent high-profile cases
      { name: 'Shelby Houlihan', country: 'USA', reason: 'American record holder, banned', source: 'USADA', agency: 'USADA', banType: 'Nandrolone', dateDetected: '2021' },
      { name: 'Ryan Crouser', country: 'USA', reason: 'Shot put, previously sanctioned', source: 'USADA', agency: 'USADA', banType: 'Whereabouts violation', dateDetected: '2013' },
      
      // Additional WADA/AIU cases
      { name: 'Asbel Kiprop', country: 'KEN', reason: '1500m world champion banned', source: 'AIU/ADAK', agency: 'AIU', banType: 'EPO', dateDetected: '2019' },
      { name: 'Rashid Ramzi', country: 'BRN', reason: 'Olympic 1500m gold stripped (2008)', source: 'WADA/IOC', agency: 'WADA', banType: 'CERA-EPO', dateDetected: '2009' },
      { name: 'Bahrain 4x400m team', country: 'BRN', reason: 'Olympic relay gold stripped (2012)', source: 'WADA/IOC', agency: 'WADA', banType: 'Steroid use', dateDetected: '2019' },
    ];
  }

  /**
   * Get the known banned athletes list
   */
  getKnownBannedAthletes() {
    return this.knownBannedAthletes;
  }

  /**
   * Parse AIU provisional suspensions web page
   */
  async parseProvisionalSuspensions() {
    try {
      console.log('Fetching AIU provisional suspensions...');
      
      const response = await axios.get(this.aiuProvisionalUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CleanSoFar/1.0)'
        }
      });

      const provisionalAthletes = this.extractAthletesFromHtml(response.data, 'provisional');
      console.log(`Found ${provisionalAthletes.length} provisionally suspended athletes`);
      return provisionalAthletes;
      
    } catch (error) {
      console.error('Error fetching provisional suspensions:', error.message);
      return [];
    }
  }

  /**
   * Parse AIU first instance decisions web page
   */
  async parseFirstInstanceDecisions() {
    try {
      console.log('Fetching AIU first instance decisions...');
      
      const response = await axios.get(this.aiuFirstInstanceUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CleanSoFar/1.0)'
        }
      });

      const firstInstanceAthletes = this.extractAthletesFromHtml(response.data, 'first_instance');
      console.log(`Found ${firstInstanceAthletes.length} first instance decision athletes`);
      return firstInstanceAthletes;
      
    } catch (error) {
      console.error('Error fetching first instance decisions:', error.message);
      return [];
    }
  }

  /**
   * Extract athlete information from AIU HTML pages
   */
  extractAthletesFromHtml(html, banStatus) {
    const athletes = [];
    try {
      const $ = cheerio.load(html);

      const STOPWORDS = new Set([
        'Contact Us','Contact','Know The Rules','Know The Process','Know us','Know Us','Understand The Rules Of Governance','Understand The Anti-doping Rules',
        'Privacy Policy','Cookie Policy','Cookies','Terms','AIU Call Room','AIU','Home','Search','News','Education','About',
        'Integrity','Power Of Respect','Global List','Global List Of Ineligible Persons','Provisional Suspensions','First Instance Decisions','Resources',
        'Anti-doping E-learning Resources','Events','Rankings','Media','What We Do','Who We Are','Governance','Anti-doping','Rules','Regulations',
        'Decision','Decisions','Appeal','Appeals','Download','Downloads','Join Us','Competition Manipulation','Knowledge Centre','Data Protection'
      ]);

      const STOP_SUBSTRINGS = [
        'anti-doping','aiu call room','competition manipulation','data protection','cookie','cookies','global list of ineligible persons',
        'join us','know the','know us','knowledge centre','power of respect','privacy policy','terms','download','appeal','decision',
        'first instance','provisional suspensions','aiu','view current vacancies','whereabouts requirements','whereabouts failures','world athletics'
      ];
      const STOP_TOKENS = new Set([
        'the','of','for','and','anti','doping','global','list','resources','know','join','room','call','manipulation','competition',
        'centre','center','policy','privacy','terms','contact','cookies','data','protection','appeal','appeals','decision','decisions',
        'vacancies','news','media','what','who','we','are','aiu','world','athletics','understand','rules','governance'
      ]);

      const looksLikeName = (text) => {
        if (!text) return false;
        const t = String(text).replace(/\s+/g, ' ').trim();
        if (!t) return false;
        if (STOPWORDS.has(t)) return false;
        const tl = t.toLowerCase();
        if (STOP_SUBSTRINGS.some(sub => tl.includes(sub))) return false;
        if (t.length < 4 || t.length > 60) return false;
        if (/\d/.test(t)) return false;
        // Canonicalize by removing diacritics and punctuation such as apostrophes/hyphens for validation
        const canon = this.canonicalizeName(t); // lower-case, letters+spaces only
        const words = canon.split(/\s+/).filter(Boolean);
        if (words.length < 2 || words.length > 4) return false;
        // Each token should be alphabetic with a minimal length
        if (!words.every(w => /^[a-z]{2,}$/.test(w))) return false;
        // Exclude content-like phrases by token stoplist
        if (words.some(w => STOP_TOKENS.has(w))) return false;
        if ((words[words.length - 1] || '').length < 3) return false;
        return true;
      };

      const addAthlete = (name, country = 'UNK') => {
        const formatted = this.formatName(name);
        athletes.push({
          name: formatted,
          country: String(country).toUpperCase(),
          banSource: 'AIU Web',
          banAgency: 'AIU',
          banType: 'Various violations',
          banReason: `${banStatus === 'provisional' ? 'Provisional suspension' : 'First instance decision'}: Various violations`,
          banDateDetected: new Date().getFullYear().toString(),
          banStatus: banStatus,
          isBanned: banStatus === 'first_instance',
          isProvisionallyBanned: banStatus === 'provisional'
        });
      };

      // 1) Parse tables first: rows with Name + Country-like cell
      $('tr').each((_, tr) => {
        const cells = $(tr).find('td').map((i, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
        if (cells.length >= 2) {
          for (let i = 0; i < cells.length - 1; i++) {
            const nm = cells[i];
            const ccRaw = cells[i + 1];
            if (!looksLikeName(nm)) continue;
            const ccNorm = this.normalizeCountryCode(ccRaw);
            if (ccNorm && ccNorm !== 'UNK') {
              addAthlete(nm, ccNorm);
              break;
            }
          }
        }
      });

      // 2) Parse content links (exclude typical nav areas)
      $('a').each((_, a) => {
        // Skip nav/header/footer/aside ancestors
        const $a = $(a);
        if ($a.parents('nav,header,footer,aside').length) return;
        const href = ($a.attr('href') || '').toLowerCase();
        // Focus on disciplinary process pages
        if (href && !href.includes('/disciplinary-process/')) return;
        const text = $a.text().replace(/\s+/g, ' ').trim();
        if (!looksLikeName(text)) return;
        addAthlete(text, 'UNK');
      });

      // 3) Also scan headings and common text containers for names; infer country from nearby text
      $('h1, h2, h3, h4, strong, span, p, li').each((_, el) => {
        const $el = $(el);
        if ($el.parents('nav,header,footer,aside').length) return;
        const text = $el.text().replace(/\s+/g, ' ').trim();
        if (!looksLikeName(text)) return;

        // Attempt to infer country from the closest content block
        const $block = $el.closest('article,section,div,li') || $el.parent();
        const blockText = ($block && $block.text() || '').replace(/\s+/g, ' ').trim();
        let inferred = 'UNK';
        const ignoreTokens = new Set(['EPO','AIU','ABP','WADA','USADA','RUSADA','UKAD','NADA','CNADA','ADAK','JAAA','IAAF','WA','IOC','CAS']);

        // 1) Prefer spelled-out country names that map to codes (e.g., "Kenya" -> KEN)
        const parts = blockText.split(/\s+/).filter(Boolean);
        for (const rawPart of parts) {
          const part = rawPart.replace(/[^A-Za-z]/g, '');
          if (!part) continue;
          // Avoid all-caps tokens in this pass (we want names like "Kenya")
          if (/^[A-Z]{3,}$/.test(part)) continue;
          const ccTry = this.normalizeCountryCode(part);
          // Only accept if normalization produced a 3-letter code different from rawPart upper
          if (ccTry && ccTry !== 'UNK' && ccTry.length === 3 && part.toUpperCase() !== ccTry) { inferred = ccTry; break; }
        }

        // 2) If not found, scan for 3-letter codes but ignore doping/agency tokens
        if (inferred === 'UNK') {
          const mccAll = blockText.match(/\b([A-Z]{3})\b/g) || [];
          for (const tok of mccAll) {
            if (ignoreTokens.has(tok)) continue;
            const ccTry = this.normalizeCountryCode(tok);
            if (ccTry && ccTry !== 'UNK' && /^[A-Z]{3}$/.test(ccTry)) { inferred = ccTry; break; }
          }
        }

        addAthlete(text, inferred);
      });

      // De-dupe by name|country
      const unique = athletes.filter((ath, idx, arr) => idx === arr.findIndex(a => a.name === ath.name && a.country === ath.country));
      console.log(`Extracted ${unique.length} unique athletes from ${banStatus} page`);
      return unique;
    } catch (error) {
      console.error('Error parsing HTML:', error.message);
      return [];
    }
  }

  /**
   * Download and parse AIU banned athletes PDF
   */
  async downloadAndParseAiuList() {
    try {
      console.log('Downloading AIU banned athletes list...');
      
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      // Determine latest PDF URL
      let pdfUrl = this.aiuPdfUrl;
      try {
        const resolved = await this.resolveLatestAiuPdfUrl();
        if (resolved) pdfUrl = resolved;
      } catch (e) {
        console.warn('Could not resolve latest AIU PDF URL, falling back to default:', e.message);
      }

      // Download PDF with timeout and smaller chunk size
      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EliteRaceTracker/1.0)'
        }
      });
      
      // Parse PDF
      const pdfBuffer = Buffer.from(response.data);
      const pdfData = await pdf(pdfBuffer);
      
      // Extract athlete names and countries from text
      const bannedAthletes = this.extractAthletesFromPdfText(pdfData.text);
      
      console.log(`Found ${bannedAthletes.length} banned athletes in AIU list`);
      return bannedAthletes;
      
    } catch (error) {
      console.error('Error downloading/parsing AIU list:', error.message);
      // Return empty array if download fails, we'll use known banned list
      return [];
    }
  }

  /**
   * Attempt to resolve the latest AIU GLIP PDF URL by scanning the downloads page
   */
  async resolveLatestAiuPdfUrl() {
    try {
      const base = 'https://www.athleticsintegrity.org/downloads/pdfs/disciplinary-process/en/';
      const { data: html } = await axios.get(base, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CleanSoFar/1.0)' } });
      const $ = cheerio.load(html);
      const candidates = [];
      $('a[href$=".pdf"]').each((_, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (!href) return;
        const url = href.startsWith('http') ? href : (base + href.replace(/^\.\//, ''));
        const t = (text || url).toLowerCase();
        if (t.includes('global') && t.includes('list')) {
          candidates.push(url);
        }
      });
      // Prefer the one with latest yyyy or month markers by lexical order
      candidates.sort();
      const pick = candidates[candidates.length - 1];
      if (pick) {
        console.log('Resolved latest AIU PDF URL:', pick);
      }
      return pick || null;
    } catch (e) {
      console.warn('resolveLatestAiuPdfUrl failed:', e.message);
      return null;
    }
  }

  /**
   * Extract athlete names and countries from AIU PDF text
   */
  extractAthletesFromPdfText(text) {
    const bannedAthletes = [];
    const lines = String(text || '').split('\n');
    let currentAthlete = null;

    // Helpers
    const headerRegex = /(GLOBAL LIST|Athletics Integrity Unit|Page \d+)/i;
    const nameCountryComma = /^(.+?),\s*([A-Z]{3,4})(?:\b|\s|,)/;         // "Name, KEN"
    const nameCountrySpace = /^(.+?)\s+([A-Z]{3,4})\s+(?:M|F)\b/;        // "Name Surname KEN M"
    const nameCountrySpaceNoGender = /^(.+?)\s+([A-Z]{3,4})(?:\b|,)/;    // "Name Surname KEN"
    const allCapsName = /^[A-Z][A-Z\s,'-]+$/;                            // "NAME SURNAME"
    const ineligibleUntilRe = /Ineligible\s+until\s+(\d{2}\.\d{2}\.\d{4})/i;
    const disqPeriodRe = /Disqualification of results(?:.*?)(\d{2}\.\d{2}\.\d{4}).*?(?:to|-)_?\s*(\d{2}\.\d{2}\.\d{4})/i;
    const violationLineRe = /Anti[-\s]?Doping Rule Violation(?:\(s\))?:\s*(.+)$/i;
    const presenceRe = /Presence of\s+(.+?)\.?$/i;
    const agencyTokens = /\b(AIU|USADA|RUSADA|UKAD|NADA|ADAK|JAAA|CNADA|ABP|WADA)\b/;

    const pushCurrent = () => {
      if (!currentAthlete) return;
      // Normalize country code and set defaults
      currentAthlete.country = this.normalizeCountryCode(currentAthlete.country || 'UNK');
      currentAthlete.name = this.formatName(currentAthlete.name);
      currentAthlete.source = 'AIU GLIP';
      currentAthlete.agency = currentAthlete.agency || 'AIU';
      currentAthlete.banType = currentAthlete.banType || 'Various violations';
      currentAthlete.reason = currentAthlete.reason || 'Listed on AIU Global Banned List';
      currentAthlete.dateDetected = currentAthlete.dateDetected || 'Various';
      bannedAthletes.push(currentAthlete);
      currentAthlete = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (!raw) continue;
      const line = raw.trim();
      if (!line || headerRegex.test(line)) continue;

      // Detect new athlete header lines
      let m = line.match(nameCountryComma) || line.match(nameCountrySpace) || line.match(nameCountrySpaceNoGender);
      let isAllCapsOnly = false;
      if (!m && allCapsName.test(line)) {
        // Potential standalone name in all-caps (country might be on the next line)
        isAllCapsOnly = true;
      }

      if (m || isAllCapsOnly) {
        // Starting a new athlete -> push previous one
        pushCurrent();

        let name = null;
        let country = 'UNK';
        if (m) {
          name = (m[1] || '').trim();
          country = (m[2] || 'UNK').trim();
        } else {
          name = line.replace(/,\s*$/, '').trim();
          // Try to look ahead for a country code on the next non-empty line
          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nline = (lines[j] || '').trim();
            const nmatch = nline.match(/\b([A-Z]{3,4})\b/);
            if (nmatch) { country = nmatch[1]; break; }
          }
        }

        currentAthlete = {
          name,
          country,
          banDetails: undefined,
          ineligibleUntil: undefined,
          disqualificationFrom: undefined,
          disqualificationTo: undefined,
          banType: undefined,
          reason: undefined,
          agency: undefined,
          source: 'AIU GLIP',
          dateDetected: undefined
        };
        continue;
      }

      // Enrich current athlete with details while within their block
      if (currentAthlete) {
        const iu = line.match(ineligibleUntilRe);
        if (iu) {
          currentAthlete.ineligibleUntil = iu[1];
          // Use year as a coarse detection date if not set
          if (!currentAthlete.dateDetected) {
            const y = iu[1].slice(-4);
            if (y) currentAthlete.dateDetected = y;
          }
        }
        const dp = line.match(disqPeriodRe);
        if (dp) {
          currentAthlete.disqualificationFrom = dp[1];
          currentAthlete.disqualificationTo = dp[2];
        }
        const viol = line.match(violationLineRe);
        if (viol) {
          currentAthlete.banType = viol[1].trim();
          currentAthlete.reason = currentAthlete.reason || viol[1].trim();
        } else {
          const pres = line.match(presenceRe);
          if (pres) {
            currentAthlete.banType = currentAthlete.banType || pres[1].trim();
            currentAthlete.reason = currentAthlete.reason || `Presence of ${pres[1].trim()}`;
          }
        }
        const ag = line.match(agencyTokens);
        if (ag && !currentAthlete.agency) {
          currentAthlete.agency = ag[1];
        }
      }
    }

    // Add the final athlete block
    pushCurrent();

    console.log(`Parsed ${bannedAthletes.length} banned athletes from AIU list`);
    return bannedAthletes;
  }

  /**
   * Normalize a record from mixed AIU sources into a consistent shape
   */
  normalizeAiuRecord(rec) {
    if (!rec) return null;
    const name = rec.name ? this.formatName(rec.name) : null;
    const country = this.normalizeCountryCode(rec.country || 'UNK');
    const isProvisionallyBanned = !!rec.isProvisionallyBanned || rec.banStatus === 'provisional';
    const isBanned = !!rec.isBanned || rec.banStatus === 'first_instance' || (!isProvisionallyBanned && !!rec.reason);
    const banSource = rec.banSource || rec.source || 'AIU';
    const banAgency = rec.banAgency || rec.agency || 'AIU';
    const banReason = rec.banReason || rec.reason || null;
    const banType = rec.banType || null;
    const banDateDetected = rec.banDateDetected || rec.dateDetected || null;
    const banStatus = rec.banStatus || (isProvisionallyBanned ? 'provisional' : (isBanned ? 'first_instance' : 'cleared'));

    return {
      name,
      country,
      isBanned,
      isProvisionallyBanned,
      banReason,
      banSource,
      banAgency,
      banType,
      banDateDetected,
      banStatus
    };
  }

  /**
   * Fetch AIU sources without mutating the database
   */
  async fetchAllAiuSources(options = {}) {
    const {
      includeProvisional = true,
      includeFirstInstance = true,
      includePdf = true,
    } = options;

    // Cache based on inclusion options to avoid repeated heavy network calls
    try {
      const key = JSON.stringify({ includeProvisional: !!includeProvisional, includeFirstInstance: !!includeFirstInstance, includePdf: !!includePdf });
      const now = Date.now();
      if (AIU_FETCH_CACHE.key === key && (now - AIU_FETCH_CACHE.ts) < (AIU_FETCH_CACHE.ttl || 180000) && AIU_FETCH_CACHE.data) {
        return AIU_FETCH_CACHE.data;
      }
    } catch (_) {}

    const results = {
      provisional: [],
      firstInstance: [],
      pdf: [],
      errors: []
    };

    const tasks = [];
    if (includeProvisional) tasks.push(this.parseProvisionalSuspensions()); else tasks.push(Promise.resolve([]));
    if (includeFirstInstance) tasks.push(this.parseFirstInstanceDecisions()); else tasks.push(Promise.resolve([]));
    if (includePdf) tasks.push(this.downloadAndParseAiuList()); else tasks.push(Promise.resolve([]));

    const [prov, first, pdfList] = await Promise.allSettled(tasks);

    if (prov.status === 'fulfilled') {
      results.provisional = prov.value || [];
    } else {
      results.errors.push({ source: 'provisional', error: prov.reason?.message || 'unknown' });
    }

    if (first.status === 'fulfilled') {
      results.firstInstance = first.value || [];
    } else {
      results.errors.push({ source: 'first_instance', error: first.reason?.message || 'unknown' });
    }

    if (pdfList.status === 'fulfilled') {
      results.pdf = pdfList.value || [];
    } else {
      results.errors.push({ source: 'aiu_pdf', error: pdfList.reason?.message || 'unknown' });
    }

    // Store in cache
    try {
      const key = JSON.stringify({ includeProvisional: !!includeProvisional, includeFirstInstance: !!includeFirstInstance, includePdf: !!includePdf });
      AIU_FETCH_CACHE.key = key;
      AIU_FETCH_CACHE.ts = Date.now();
      AIU_FETCH_CACHE.data = results;
    } catch (_) {}

    return results;
  }

  /**
   * Combine AIU athletes (dedupe by name+country) and annotate source provenance
   */
  combineAiuAthletes({ provisional = [], firstInstance = [], pdf = [] }) {
    const map = new Map();

    const ingest = (arr, tag) => {
      for (const rec of arr) {
        const norm = this.normalizeAiuRecord(rec);
        if (!norm || !norm.name || !norm.country || norm.name.length < 2) continue;
        const key = `${norm.name.toLowerCase()}|${norm.country}`;
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { ...norm, sources: [tag] });
        } else {
          // Merge booleans and enrich fields if empty
          existing.isBanned = existing.isBanned || norm.isBanned;
          existing.isProvisionallyBanned = existing.isProvisionallyBanned || norm.isProvisionallyBanned;
          existing.banReason = existing.banReason || norm.banReason;
          existing.banSource = existing.banSource || norm.banSource;
          existing.banAgency = existing.banAgency || norm.banAgency;
          existing.banType = existing.banType || norm.banType;
          existing.banDateDetected = existing.banDateDetected || norm.banDateDetected;
          existing.banStatus = existing.banStatus || norm.banStatus;
          if (!existing.sources.includes(tag)) existing.sources.push(tag);
        }
      }
    };

    ingest(provisional, 'AIU Web: provisional');
    ingest(firstInstance, 'AIU Web: first_instance');
    ingest(pdf, 'AIU GLIP PDF');

    return Array.from(map.values());
  }

  /**
   * Build a non-destructive preview to verify completeness of AIU ingestion
   */
  async getAiuPreview(limit = 100, options = {}) {
    const sources = await this.fetchAllAiuSources(options);
    const combined = this.combineAiuAthletes(sources);

    const summary = {
      counts: {
        provisional: sources.provisional.length,
        firstInstance: sources.firstInstance.length,
        pdf: sources.pdf.length,
        combined: combined.length
      },
      errors: sources.errors,
      sample: combined.slice(0, Math.min(limit, combined.length))
    };
    return summary;
  }

  /**
   * Compare combined AIU list with DB to identify missing or unmarked athletes
   */
  async compareAiuWithDatabase(limitMissing = 50, limitPresent = 20, options = {}) {
    const {
      matchMode = 'cascade',
      ignoreCountryWhenUnknown = true,
      includeProvisional = true,
      includeFirstInstance = true,
      includePdf = true,
    } = options || {};
    const sources = await this.fetchAllAiuSources({ includeProvisional, includeFirstInstance, includePdf });
    const combined = this.combineAiuAthletes(sources);

    const Athlete = require('../models/Athlete');
    const dbAthletes = await Athlete.find({}, 'name country isBanned isProvisionallyBanned banStatus').lean();

    // Precompute DB maps for multiple match strategies
    const dbStrict = new Map();
    const dbNormalized = new Map();
    const dbTokens = new Map();
    const dbNameOnlyNormalized = new Map(); // name -> representative record
    const dbNameOnlyTokens = new Map();     // tokenKey -> representative record

    for (const a of dbAthletes) {
      if (!a?.name || !a?.country) continue;
      const country = this.normalizeCountryCode(a.country);
      const nameLower = String(a.name).toLowerCase();
      const nameNorm = this.canonicalizeName(a.name);
      const nameTok = this.tokenKey(a.name);
      dbStrict.set(`${nameLower}|${country}`, a);
      dbNormalized.set(`${nameNorm}|${country}`, a);
      dbTokens.set(`${nameTok}|${country}`, a);
      if (!dbNameOnlyNormalized.has(nameNorm)) dbNameOnlyNormalized.set(nameNorm, a);
      if (!dbNameOnlyTokens.has(nameTok)) dbNameOnlyTokens.set(nameTok, a);
    }

    const missing = [];
    const alreadyPresent = [];

    const tryFind = (rec) => {
      const country = this.normalizeCountryCode(rec.country);
      const nameLower = String(rec.name || '').toLowerCase();
      const nameNorm = this.canonicalizeName(rec.name || '');
      const nameTok = this.tokenKey(rec.name || '');
      const unknownCountry = ignoreCountryWhenUnknown && this.isUnknownCountry(country);

      const strictKey = `${nameLower}|${country}`;
      const normKey = `${nameNorm}|${country}`;
      const tokKey = `${nameTok}|${country}`;

      const modes = {
        strict: () => dbStrict.get(strictKey),
        normalized: () => dbNormalized.get(normKey),
        tokens: () => dbTokens.get(tokKey),
        cascade: () => {
          let found = dbStrict.get(strictKey) || dbNormalized.get(normKey) || dbTokens.get(tokKey);
          if (!found && unknownCountry) {
            // fallback: name-only match
            found = dbNameOnlyNormalized.get(nameNorm) || dbNameOnlyTokens.get(nameTok);
          }
          return found;
        }
      };

      const getter = modes[matchMode] || modes.cascade;
      let found = getter();
      if (!found && unknownCountry && matchMode !== 'strict') {
        // If chosen mode didn't match and country is unknown, try name-only variants
        found = dbNameOnlyNormalized.get(nameNorm) || dbNameOnlyTokens.get(nameTok);
      }
      return found;
    };

    for (const rec of combined) {
      const db = tryFind(rec);
      if (!db) {
        missing.push({ ...rec, reason: rec.banReason || rec.banType || null });
      } else {
        const marked = db.isBanned || db.isProvisionallyBanned || (db.banStatus && db.banStatus !== 'cleared');
        if (marked) {
          alreadyPresent.push({
            name: rec.name,
            country: rec.country,
            banStatus: db.banStatus || (db.isBanned ? 'banned' : (db.isProvisionallyBanned ? 'provisional' : 'cleared')),
            sources: rec.sources
          });
        } else {
          missing.push({ ...rec, reason: rec.banReason || rec.banType || null });
        }
      }
    }

    const result = {
      counts: {
        aiuCombined: combined.length,
        dbTotal: dbAthletes.length,
        missingOrUnmarkedInDb: missing.length,
        alreadyPresent: alreadyPresent.length
      },
      sample: {
        missing: missing.slice(0, Math.min(limitMissing, missing.length)),
        present: alreadyPresent.slice(0, Math.min(limitPresent, alreadyPresent.length))
      },
      sourceCounts: {
        provisional: sources.provisional.length,
        firstInstance: sources.firstInstance.length,
        pdf: sources.pdf.length
      },
      errors: sources.errors,
      optionsUsed: { matchMode, ignoreCountryWhenUnknown }
    };

    return result;
  }

  /**
   * Format athlete name from ALL CAPS to proper case
   */
  formatName(name) {
    return String(name || '').toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Remove diacritics and normalize whitespace/punctuation for name matching
   */
  canonicalizeName(name) {
    if (!name) return '';
    let s = String(name);
    try {
      s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (_) {}
    s = s.toLowerCase();
    s = s.replace(/[’'`´]/g, '');     // drop apostrophes
    s = s.replace(/[.\-]/g, ' ');     // hyphens/dots to space
    s = s.replace(/[^a-z\s]/g, '');   // strip non-letters
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  /**
   * Token-key for order-agnostic name matching (e.g., "Kipchoge Eliud" == "Eliud Kipchoge")
   */
  tokenKey(name) {
    const canon = this.canonicalizeName(name);
    if (!canon) return '';
    const toks = canon.split(' ').filter(Boolean).sort();
    return toks.join(' ');
  }

  /**
   * Normalize country code into a comparable value (prefer 3-letter codes)
   */
  normalizeCountryCode(country) {
    if (!country) return 'UNK';
    let c = String(country).trim().toUpperCase();
    const map2to3 = {
      US: 'USA', GB: 'GBR', UK: 'GBR', IE: 'IRL', UA: 'UKR', RU: 'RUS', BY: 'BLR',
      KZ: 'KAZ', KE: 'KEN', ET: 'ETH', MA: 'MAR', PL: 'POL', CN: 'CHN', CH: 'SUI',
      BR: 'BRA', CA: 'CAN', MX: 'MEX', QA: 'QAT', AE: 'UAE', SA: 'KSA', QA: 'QAT'
    };
    const mapSyn = {
      BHR: 'BRN', // Bahrain (ISO-3 -> IOC/WorldAthletics)
    };
    const mapNames = {
      'KENYA': 'KEN',
      'ETHIOPIA': 'ETH',
      'UNITED STATES': 'USA',
      'UNITED STATES OF AMERICA': 'USA',
      'GREAT BRITAIN': 'GBR',
      'UNITED KINGDOM': 'GBR',
      'BAHRAIN': 'BRN',
      'QATAR': 'QAT',
      'MOROCCO': 'MAR',
      'UGANDA': 'UGA',
      'ERITREA': 'ERI',
      'NIGERIA': 'NGR',
      'SOUTH AFRICA': 'RSA',
      'ETH': 'ETH', // sometimes appears as code-like name
      'KEN': 'KEN',
      'USA': 'USA'
    };
    if (c.length === 2 && map2to3[c]) c = map2to3[c];
    if (mapSyn[c]) c = mapSyn[c];
    if (mapNames[c]) c = mapNames[c];
    return c || 'UNK';
  }

  /**
   * Whether country value should be considered unknown for matching purposes
   */
  isUnknownCountry(country) {
    const c = String(country || '').trim().toUpperCase();
    return !c || c === 'UNK' || c === 'UNKNOWN' || c === 'N/A' || c === 'NA';
  }

  /**
   * Update athlete ban status in database using known list only
   */
  async updateAthleteBanStatusFromKnownList() {
    try {
      const Athlete = require('../models/Athlete');
      const bannedAthletes = this.knownBannedAthletes;
      let updatedCount = 0;
      
      for (const bannedAthlete of bannedAthletes) {
        // Find matching athletes in database (fuzzy matching)
        const athletes = await Athlete.find({
          $or: [
            { name: new RegExp(bannedAthlete.name, 'i') },
            { name: new RegExp(bannedAthlete.name.replace(/\s+/g, '.*'), 'i') }
          ],
          country: bannedAthlete.country
        });
        
        for (const athlete of athletes) {
          const needsUpdate = !athlete.isBanned && !athlete.isProvisionallyBanned;
          
          if (needsUpdate) {
            // Set ban status based on type
            if (bannedAthlete.banStatus === 'provisional') {
              athlete.isProvisionallyBanned = true;
              athlete.banStatus = 'provisional';
            } else {
              athlete.isBanned = true;
              athlete.banStatus = bannedAthlete.banStatus || 'permanent';
            }
            
            athlete.banReason = bannedAthlete.reason;
            athlete.banSource = bannedAthlete.source;
            athlete.banAgency = bannedAthlete.agency;
            athlete.banType = bannedAthlete.banType;
            athlete.banDateDetected = bannedAthlete.dateDetected;
            await athlete.save();
            updatedCount++;
            
            const statusText = bannedAthlete.banStatus === 'provisional' ? 'provisionally suspended' : 'banned';
            console.log(`Marked ${athlete.name} (${athlete.country}) as ${statusText} by ${bannedAthlete.agency}`);
          }
        }
      }
      
      console.log(`Updated ban status for ${updatedCount} athletes`);
      return { updated: updatedCount, total: bannedAthletes.length };
    } catch (error) {
      console.error('Error updating athlete ban status:', error);
      throw error;
    }
  }

  /**
   * Update athlete ban status in database (using all AIU sources)
   */
  async updateAthleteBanStatus() {
    try {
      const bannedAthletes = await this.getAllBannedAthletes();
      let updatedCount = 0;
      const Athlete = require('../models/Athlete');
      
      for (const bannedAthlete of bannedAthletes) {
        // Find matching athletes in database (fuzzy matching)
        const athletes = await Athlete.find({
          $or: [
            { name: new RegExp(bannedAthlete.name, 'i') },
            { name: new RegExp(bannedAthlete.name.replace(/\s+/g, '.*'), 'i') }
          ],
          country: bannedAthlete.country
        });
        
        for (const athlete of athletes) {
          if (!athlete.isBanned) {
            athlete.isBanned = true;
            athlete.banReason = bannedAthlete.reason;
            athlete.banSource = bannedAthlete.source || 'Known case';
            await athlete.save();
            updatedCount++;
            console.log(`Marked ${athlete.name} (${athlete.country}) as banned`);
          }
        }
      }
      
      console.log(`Updated ban status for ${updatedCount} athletes`);
      return { updated: updatedCount, total: bannedAthletes.length };
    } catch (error) {
      console.error('Error updating athlete ban status:', error);
      throw error;
    }
  }

  /**
   * Aggregate all banned/provisionally banned athletes from AIU sources and known list
   */
  async getAllBannedAthletes(options = {}) {
    const {
      includeProvisional = true,
      includeFirstInstance = true,
      includePdf = true,
      includeKnown = true,
    } = options || {};

    // Fetch from live AIU sources with in-memory caching
    const sources = await this.fetchAllAiuSources({ includeProvisional, includeFirstInstance, includePdf });
    let combined = this.combineAiuAthletes(sources);

    // Merge in known banned list (normalized) if requested
    if (includeKnown && Array.isArray(this.knownBannedAthletes) && this.knownBannedAthletes.length) {
      const knownNorm = this.knownBannedAthletes
        .map((rec) => this.normalizeAiuRecord(rec))
        .filter((r) => r && r.name && r.country);
      const existingKeys = new Set(
        combined.map((r) => `${String(r.name).toLowerCase()}|${this.normalizeCountryCode(r.country)}`)
      );
      for (const kn of knownNorm) {
        const key = `${String(kn.name).toLowerCase()}|${this.normalizeCountryCode(kn.country)}`;
        if (!existingKeys.has(key)) {
          combined.push({ ...kn, sources: ['Known list'] });
          existingKeys.add(key);
        }
      }
    }

    return combined;
  }

  /**
   * Check if an athlete is banned
   */
  async isAthleteBanned(name, country, options = {}) {
    const {
      matchMode = 'cascade',
      ignoreCountryWhenUnknown = true,
      includeProvisional = true,
      includeFirstInstance = true,
      includePdf = true,
      includeKnown = true,
    } = options || {};
    const all = await this.getAllBannedAthletes({
      includeProvisional,
      includeFirstInstance,
      includePdf,
      includeKnown,
    });

    const c = this.normalizeCountryCode(country || 'UNK');
    const nameLower = String(name || '').toLowerCase();
    const nameNorm = this.canonicalizeName(name || '');
    const nameTok = this.tokenKey(name || '');
    const unknownCountry = ignoreCountryWhenUnknown && this.isUnknownCountry(c);

    const predicateStrict = (rec) =>
      rec && String(rec.name || '').toLowerCase() === nameLower &&
      this.normalizeCountryCode(rec.country) === c;

    const predicateNorm = (rec) =>
      this.canonicalizeName(rec.name || '') === nameNorm &&
      this.normalizeCountryCode(rec.country) === c;

    const predicateTok = (rec) =>
      this.tokenKey(rec.name || '') === nameTok &&
      this.normalizeCountryCode(rec.country) === c;

    const modes = {
      strict: () => all.find(predicateStrict),
      normalized: () => all.find(predicateNorm),
      tokens: () => all.find(predicateTok),
      cascade: () => all.find(predicateStrict) || all.find(predicateNorm) || all.find(predicateTok),
    };

    const getter = modes[matchMode] || modes.cascade;
    let found = getter();
    if (!found && unknownCountry) {
      // Name-only fallback when the input country is unknown/UNK
      found = all.find((rec) => this.canonicalizeName(rec.name || '') === nameNorm) ||
              all.find((rec) => this.tokenKey(rec.name || '') === nameTok);
    }

    return !!found;
  }

  /**
   * Get ban statistics by agency/source
   */
  async getBanStatistics() {
    try {
      const Athlete = require('../models/Athlete');
      const [bannedAthletes, provisionalAthletes] = await Promise.all([
        Athlete.find({ isBanned: true }),
        Athlete.find({ isProvisionallyBanned: true }),
      ]);

      const stats = {
        totalBanned: bannedAthletes.length,
        provisionalSuspensions: provisionalAthletes.length,
        firstInstanceDecisions: bannedAthletes.filter(a => (a.banStatus || '').toLowerCase() === 'first_instance').length,
        byAgency: {},
        byBanType: {},
        byCountry: {},
        bySource: {},
      };

      // Aggregate across both banned and provisional sets for breakdowns
      [...bannedAthletes, ...provisionalAthletes].forEach(athlete => {
        const agency = athlete.banAgency || 'Unknown';
        stats.byAgency[agency] = (stats.byAgency[agency] || 0) + 1;

        const banType = athlete.banType || 'Unknown';
        stats.byBanType[banType] = (stats.byBanType[banType] || 0) + 1;

        const country = athlete.country || 'Unknown';
        stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;

        const source = athlete.banSource || 'Unknown';
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting ban statistics:', error);
      throw error;
    }
  }

  /**
   * Get banned athletes from database with full source information
   */
  async getBannedAthletesFromDatabase(options = {}) {
    try {
      const { includeBanned = true, includeProvisional = true } = options || {};
      const Athlete = require('../models/Athlete');

      // Build query to include banned and/or provisional athletes
      const ors = [];
      if (includeBanned) ors.push({ isBanned: true });
      if (includeProvisional) ors.push({ isProvisionallyBanned: true });
      const query = ors.length === 0 ? { isBanned: true } : (ors.length === 1 ? ors[0] : { $or: ors });

      const athletes = await Athlete.find(query)
        .select('name country banReason banSource banAgency banType banDateDetected isBanned isProvisionallyBanned banStatus')
        .sort({ name: 1 });

      return athletes.map(athlete => ({
        name: athlete.name,
        country: athlete.country,
        reason: athlete.banReason,
        source: athlete.banSource,
        agency: athlete.banAgency,
        banType: athlete.banType,
        dateDetected: athlete.banDateDetected,
        isBanned: athlete.isBanned,
        isProvisionallyBanned: athlete.isProvisionallyBanned,
        banStatus: athlete.banStatus,
      }));
    } catch (error) {
      console.error('Error fetching banned athletes from database:', error);
      throw error;
    }
  }

  /**
   * Clean up incorrectly parsed AIU entries (dates as names, etc.)
   */
  async cleanupInvalidAiuEntries() {
    try {
      const Athlete = require('../models/Athlete');
      // Known non-athlete phrases that sometimes slip through parsing
      const badExactPhrases = [
        'AIU Call Room','Anti-doping E-learning Resources','Competition Manipulation','Contact Us','Cookies','Cookie Policy','Data Protection',
        'Global List Of Ineligible Persons','Join Us','Know The Process','Know The Rules','Know us','Know Us','Knowledge Centre',
        'Power Of Respect','Privacy Policy','Terms','Understand The Prohibited List','Understand The Anti-doping Rules',
        'View Current Vacancies','Whereabouts Requirements','Whereabouts Failures','World Athletics','Aiu Decision Appealable',
        'Final Cas Decision','Final Aiu Decision','Pending Before Cas','Final Dt Decision','Final Cas Appeal Decision'
      ];
      const badSubstringPatterns = [
        /\baiu call room\b/i,
        /\banti[-\s]?doping\b/i,
        /\bcompetition manipulation\b/i,
        /\bcontact us\b/i,
        /\bcookies?\b/i,
        /\bdata protection\b/i,
        /\bglobal list of ineligible persons\b/i,
        /\bjoin us\b/i,
        /\bknow (?:the|us|process|rules)\b/i,
        /\bknowledge centre\b/i,
        /\bpower of respect\b/i,
        /\bwhereabouts (?:requirements|failures)\b/i,
        /\bview current vacancies\b/i,
        /\bund(erstand)? the (?:prohibited list|anti[-\s]?doping rules)\b/i
      ];
      const badNameOrs = [ { name: { $in: badExactPhrases } }, ...badSubstringPatterns.map(re => ({ name: { $regex: re } })) ];
      
      // Find and remove entries with invalid names (dates, single letters, etc.)
      const invalidEntries = await Athlete.find({
        $or: [
          { name: { $regex: /^\d{2}\/\d{2}\/\d{4}$/ } }, // Dates as names
          { name: { $regex: /^\d+$/ } }, // Just numbers
          { name: { $regex: /^[A-Z]{1,3}$/ } }, // Just country codes
          { name: { $regex: /\d{2}\/\d{2}\/\d{4}/ } }, // Contains dates
          { name: { $regex: /^#/ } }, // Starts with #
          { name: { $in: ['BAKHAREVA S LAS T NI KOVA', 'GONZALES ROMERO', 'WATHTHAKANKANAMGE', '#power Of Respect'] } }, // Known bad entries
          { country: { $in: ['MARYNA BEKH-ROMANCHUK', 'RONCER KIPKORIR KONGA', 'BLESSING OKAGBARE', 'MOHAMED KATIR', 'CELESTINE CHEPCHIRCHIR'] } }, // Names in country field
          { banSource: 'AIU Web', name: { $regex: /^[A-Z\s]{50,}$/ } }, // Overly long garbled names
          { banSource: 'AIU Web', name: { $not: { $regex: /^[A-Z][a-zA-Z\s\-'\.]+$/ } } }, // Invalid name format
          ...badNameOrs
        ]
      });
      
      const deleteCount = await Athlete.deleteMany({
        $or: [
          { name: { $regex: /^\d{2}\/\d{2}\/\d{4}$/ } },
          { name: { $regex: /^\d+$/ } },
          { name: { $regex: /^[A-Z]{1,3}$/ } },
          { name: { $regex: /\d{2}\/\d{2}\/\d{4}/ } },
          { name: { $regex: /^#/ } },
          { name: { $in: ['BAKHAREVA S LAS T NI KOVA', 'GONZALES ROMERO', 'WATHTHAKANKANAMGE', '#power Of Respect'] } },
          { country: { $in: ['MARYNA BEKH-ROMANCHUK', 'RONCER KIPKORIR KONGA', 'BLESSING OKAGBARE', 'MOHAMED KATIR', 'CELESTINE CHEPCHIRCHIR'] } },
          { banSource: 'AIU Web', name: { $regex: /^[A-Z\s]{50,}$/ } },
          { banSource: 'AIU Web', name: { $not: { $regex: /^[A-Z][a-zA-Z\s\-'\.]+$/ } } },
          ...badNameOrs
        ]
      });
      
      console.log(`Cleaned up ${deleteCount.deletedCount} invalid AIU entries`);
      return { deletedCount: deleteCount.deletedCount, invalidEntries: invalidEntries.length };
      
    } catch (error) {
      console.error('Error cleaning up invalid AIU entries:', error);
      throw error;
    }
  }

  /**
   * Populate database with all current AIU banned athletes from live sources
   */
  async populateAllCurrentAiuAthletes() {
    try {
      const Athlete = require('../models/Athlete');
      let totalAdded = 0;
      let totalUpdated = 0;
      const errors = [];
      
      console.log('Fetching all current AIU banned athletes from live sources...');
      
      // Get live data from all AIU sources
      const [provisionalAthletes, firstInstanceAthletes, aiuPdfAthletes] = await Promise.allSettled([
        this.parseProvisionalSuspensions(),
        this.parseFirstInstanceDecisions(), 
        this.downloadAndParseAiuList()
      ]);
      
      // Combine all results
      const allAiuAthletes = [];
      
      if (provisionalAthletes.status === 'fulfilled') {
        allAiuAthletes.push(...provisionalAthletes.value);
        console.log(`✓ Found ${provisionalAthletes.value.length} provisional suspensions`);
      } else {
        console.error('✗ Failed to fetch provisional suspensions:', provisionalAthletes.reason?.message);
        errors.push('Provisional suspensions failed');
      }
      
      if (firstInstanceAthletes.status === 'fulfilled') {
        allAiuAthletes.push(...firstInstanceAthletes.value);
        console.log(`✓ Found ${firstInstanceAthletes.value.length} first instance decisions`);
      } else {
        console.error('✗ Failed to fetch first instance decisions:', firstInstanceAthletes.reason?.message);
        errors.push('First instance decisions failed');
      }
      
      if (aiuPdfAthletes.status === 'fulfilled') {
        allAiuAthletes.push(...aiuPdfAthletes.value);
        console.log(`✓ Found ${aiuPdfAthletes.value.length} athletes from AIU PDF`);
      } else {
        console.error('✗ Failed to fetch AIU PDF:', aiuPdfAthletes.reason?.message);
        errors.push('AIU PDF failed');
      }
      
      console.log(`Total found: ${allAiuAthletes.length} athletes from AIU sources`);
      
      // Process each athlete
      for (const bannedAthlete of allAiuAthletes) {
        try {
          // Skip athletes without proper name or country
          if (!bannedAthlete.name || !bannedAthlete.country || bannedAthlete.name.length < 2) {
            console.log(`Skipping invalid athlete: ${bannedAthlete.name || 'No name'} (${bannedAthlete.country || 'No country'})`);
            continue;
          }
          
          // Check if athlete already exists (case-insensitive name match)
          const existingAthlete = await Athlete.findOne({
            name: new RegExp(`^${bannedAthlete.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
            country: bannedAthlete.country
          });
          
          if (existingAthlete) {
            // Update existing athlete with ban information
            let updated = false;
            
            if (!existingAthlete.isBanned && bannedAthlete.isBanned) {
              existingAthlete.isBanned = bannedAthlete.isBanned;
              updated = true;
            }
            
            if (!existingAthlete.isProvisionallyBanned && bannedAthlete.isProvisionallyBanned) {
              existingAthlete.isProvisionallyBanned = bannedAthlete.isProvisionallyBanned;
              updated = true;
            }
            
            if (!existingAthlete.banReason && (bannedAthlete.banReason || bannedAthlete.reason)) {
              existingAthlete.banReason = bannedAthlete.banReason || bannedAthlete.reason;
              updated = true;
            }
            
            if (!existingAthlete.banSource && (bannedAthlete.banSource || bannedAthlete.source)) {
              existingAthlete.banSource = bannedAthlete.banSource || bannedAthlete.source;
              updated = true;
            }
            
            if (!existingAthlete.banAgency && (bannedAthlete.banAgency || bannedAthlete.agency)) {
              existingAthlete.banAgency = bannedAthlete.banAgency || bannedAthlete.agency;
              updated = true;
            }
            
            if (!existingAthlete.banType && bannedAthlete.banType) {
              existingAthlete.banType = bannedAthlete.banType;
              updated = true;
            }
            
            if (!existingAthlete.banDateDetected && (bannedAthlete.banDateDetected || bannedAthlete.dateDetected)) {
              existingAthlete.banDateDetected = bannedAthlete.banDateDetected || bannedAthlete.dateDetected;
              updated = true;
            }
            
            if (!existingAthlete.banStatus && bannedAthlete.banStatus) {
              existingAthlete.banStatus = bannedAthlete.banStatus;
              updated = true;
            }
            
            if (updated) {
              await existingAthlete.save();
              totalUpdated++;
              console.log(`Updated ${existingAthlete.name} (${existingAthlete.country}) - ${bannedAthlete.banStatus || 'banned'}`);
            }
          } else {
            // Create new athlete
            const updateData = {
              isBanned: bannedAthlete.isBanned || false,
              isProvisionallyBanned: bannedAthlete.isProvisionallyBanned || false,
              banReason: bannedAthlete.banReason || bannedAthlete.reason,
              banSource: bannedAthlete.banSource || bannedAthlete.source,
              banAgency: bannedAthlete.banAgency || bannedAthlete.agency,
              banType: bannedAthlete.banType,
              banDateDetected: bannedAthlete.banDateDetected || bannedAthlete.dateDetected,
              banStatus: bannedAthlete.banStatus || 'cleared'
            };
            
            const newAthlete = new Athlete({
              name: bannedAthlete.name,
              country: bannedAthlete.country,
              gender: 'Female', // Default to Female, will be updated when we have more data
              ...updateData
            });
            
            await newAthlete.save();
            totalAdded++;
            console.log(`Added ${newAthlete.name} (${newAthlete.country}) - ${bannedAthlete.banStatus || 'banned'}`);
          }
        } catch (error) {
          console.error(`Error processing ${bannedAthlete.name}:`, error.message);
          errors.push(`Failed to process ${bannedAthlete.name}: ${error.message}`);
        }
      }
      
      const summary = {
        totalResults: allAiuAthletes.length,
        processedResults: allAiuAthletes.length - errors.length,
        newAthletes: totalAdded,
        updatedBanStatus: totalUpdated,
        errors: errors,
        totalBannedAthletes: totalAdded + totalUpdated
      };
      
      console.log(`AIU population complete: ${totalAdded} added, ${totalUpdated} updated, ${errors.length} errors`);
      return summary;
      
    } catch (error) {
      console.error('Error populating AIU athletes:', error);
      throw error;
    }
  }
}

module.exports = BannedAthleteService;
