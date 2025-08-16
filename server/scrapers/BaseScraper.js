/**
 * Base scraper class that all site-specific scrapers will extend
 */

const axios = require('axios');
const cheerio = require('cheerio');

class BaseScraper {
  /**
   * Constructor for the base scraper
   * @param {string} name - Name of the scraper
   * @param {string} baseUrl - Base URL for the scraper
   */
  constructor(name, baseUrl) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.axios = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'Elite Race Tracker/1.0 (https://eliteracetracker.com)'
      }
    });
  }

  /**
   * Fetch HTML from a URL
   * @param {string} path - Path to fetch (will be appended to baseUrl)
   * @returns {Promise<string>} - HTML content
   */
  async fetchHtml(path) {
    try {
      const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Elite Race Tracker/1.0 (https://eliteracetracker.com)'
        },
        // Disable SSL certificate verification for development
        // In production, you should use proper certificates
        httpsAgent: new (require('https').Agent)({ 
          rejectUnauthorized: false 
        })
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${path}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse HTML content with cheerio
   * @param {string} html - HTML content
   * @returns {CheerioAPI} - Cheerio API
   */
  parseHtml(html) {
    return cheerio.load(html);
  }

  /**
   * Check if a result is a world record or country best
   * @param {Object} result - Result object
   * @param {Object} recordsData - Records data object
   * @returns {Object} - Result with record flags
   */
  checkForRecords(result, recordsData) {
    const { finishTime, race, athlete } = result;
    const { distance, distanceUnit, gender } = race;
    const { country } = athlete;
    
    // Format key for looking up records
    const recordKey = `${distance}${distanceUnit}_${gender}`;
    
    // Check for world record
    if (recordsData.worldRecords[recordKey] && 
        finishTime < recordsData.worldRecords[recordKey].time) {
      result.isWorldRecord = true;
      result.recordDifference = recordsData.worldRecords[recordKey].time - finishTime;
    }
    
    // Check for country record
    if (recordsData.countryRecords[country] && 
        recordsData.countryRecords[country][recordKey] &&
        finishTime < recordsData.countryRecords[country][recordKey].time) {
      result.isCountryRecord = true;
      result.countryRecordDifference = recordsData.countryRecords[country][recordKey].time - finishTime;
    }
    
    // Check for season best
    const currentYear = new Date().getFullYear();
    if (recordsData.seasonBests[currentYear] && 
        recordsData.seasonBests[currentYear][recordKey] &&
        finishTime < recordsData.seasonBests[currentYear][recordKey].time) {
      result.isSeasonBest = true;
    }
    
    return result;
  }

  /**
   * Main scrape method to be implemented by subclasses
   * @param {Object} options - Scraper options
   * @returns {Promise<Array>} - Array of results
   */
  async scrape(options) {
    throw new Error('Scrape method must be implemented by subclass');
  }
}

module.exports = BaseScraper;
