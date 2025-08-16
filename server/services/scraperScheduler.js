/**
 * Scraper Scheduler Service
 * 
 * Manages the scheduling of scrapers with configurable frequencies:
 * - Default: Once per day
 * - During major events: Hourly updates
 * 
 * Also implements caching of scraper results for efficiency
 */

const schedule = require('node-schedule');
const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import scraper modules - using dynamic imports to avoid issues if modules aren't available
let BostonMarathonScraper, WorldAthleticsScraper, AIUBannedAthletesScraper;

try {
  BostonMarathonScraper = require('../scrapers/sites/bostonmarathonv2');
} catch (e) {
  console.log('Boston Marathon scraper not available, will be skipped');
}

try {
  WorldAthleticsScraper = require('../scrapers/sites/worldathletics');
} catch (e) {
  console.log('World Athletics scraper not available, will be skipped');
}

try {
  AIUBannedAthletesScraper = require('../scrapers/sites/athleticsintegrity');
} catch (e) {
  console.log('AIU Banned Athletes scraper not available, will be skipped');
}

// Cache configuration (TTL in seconds)
const DEFAULT_CACHE_TTL = 24 * 60 * 60; // 24 hours cache for regular scrapes
const EVENT_CACHE_TTL = 60 * 60;        // 1 hour cache during events

// Initialize cache
const scraperCache = new NodeCache({
  stdTTL: DEFAULT_CACHE_TTL,
  checkperiod: 120
});

// Active events tracking
const activeEvents = new Map();

/**
 * Register an active event to trigger more frequent scraping
 * @param {string} eventId - Unique identifier for the event
 * @param {Date} startDate - When the event starts
 * @param {Date} endDate - When the event ends
 * @param {Array} scrapers - List of scraper IDs to run hourly during this event
 */
const registerActiveEvent = (eventId, startDate, endDate, scrapers) => {
  activeEvents.set(eventId, {
    startDate,
    endDate,
    scrapers
  });
  
  console.log(`Event registered: ${eventId} from ${startDate} to ${endDate}`);
};

/**
 * Check if a specific scraper should run at higher frequency due to active events
 * @param {string} scraperId - Identifier for the scraper
 * @returns {boolean} - True if scraper should run at higher frequency
 */
const shouldRunHighFrequency = (scraperId) => {
  const now = new Date();
  
  for (const [_, event] of activeEvents) {
    if (event.scrapers.includes(scraperId) && 
        now >= event.startDate && 
        now <= event.endDate) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get the appropriate cache TTL based on event status
 * @param {string} scraperId - Identifier for the scraper
 * @returns {number} - Cache TTL in seconds
 */
const getCacheTTL = (scraperId) => {
  return shouldRunHighFrequency(scraperId) ? EVENT_CACHE_TTL : DEFAULT_CACHE_TTL;
};

/**
 * Run a specific scraper and cache the results
 * @param {string} scraperId - Identifier for the scraper
 * @param {Object} options - Options to pass to the scraper
 * @returns {Promise<Object>} - Scraper results
 */
const runScraper = async (scraperId, options = {}) => {
  try {
    console.log(`Running scraper: ${scraperId}`);
    
    // Check cache first
    const cacheKey = `${scraperId}:${JSON.stringify(options)}`;
    const cachedData = scraperCache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${scraperId}`);
      return cachedData;
    }
    
    // Run the appropriate scraper
    let results;
    switch (scraperId) {
      case 'boston-marathon':
        const bostonScraper = new BostonMarathonScraper();
        results = await bostonScraper.scrape(options);
        break;
      case 'world-athletics':
        const worldAthleticsScraper = new WorldAthleticsScraper();
        results = await worldAthleticsScraper.scrape(options);
        break;
      case 'aiu-banned':
        const aiuScraper = new AIUBannedAthletesScraper();
        results = await aiuScraper.scrape(options);
        break;
      default:
        throw new Error(`Unknown scraper: ${scraperId}`);
    }
    
    // Cache the results with the appropriate TTL
    scraperCache.set(cacheKey, results, getCacheTTL(scraperId));
    
    return results;
  } catch (error) {
    console.error(`Error running scraper ${scraperId}:`, error);
    throw error;
  }
};

/**
 * Initialize all scraper schedules
 */
const initializeSchedules = () => {
  // Daily schedule (default for all scrapers)
  schedule.scheduleJob('0 0 * * *', async () => {
    console.log('Running daily scraper jobs');
    
    try {
      // Run AIU banned athletes scraper daily
      await runScraper('aiu-banned');
      
      // Run other scrapers if they don't have active events
      if (!shouldRunHighFrequency('boston-marathon')) {
        await runScraper('boston-marathon');
      }
      
      if (!shouldRunHighFrequency('world-athletics')) {
        await runScraper('world-athletics');
      }
    } catch (error) {
      console.error('Error in daily scraper jobs:', error);
    }
  });
  
  // Hourly schedule (for active events)
  schedule.scheduleJob('0 * * * *', async () => {
    console.log('Checking for hourly scraper jobs');
    
    try {
      // Check which scrapers should run hourly
      if (shouldRunHighFrequency('boston-marathon')) {
        await runScraper('boston-marathon');
      }
      
      if (shouldRunHighFrequency('world-athletics')) {
        await runScraper('world-athletics');
      }
    } catch (error) {
      console.error('Error in hourly scraper jobs:', error);
    }
  });
  
  console.log('Scraper schedules initialized');
};

/**
 * Manually trigger a scraper run
 * @param {string} scraperId - Identifier for the scraper
 * @param {Object} options - Options to pass to the scraper
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<Object>} - Scraper results
 */
const triggerScraper = async (scraperId, options = {}, forceRefresh = false) => {
  if (forceRefresh) {
    // Remove from cache if force refresh
    const cacheKey = `${scraperId}:${JSON.stringify(options)}`;
    scraperCache.del(cacheKey);
  }
  
  return await runScraper(scraperId, options);
};

/**
 * Clear scraper cache
 * @param {string} scraperId - Optional scraper ID to clear specific cache
 */
const clearCache = (scraperId = null) => {
  if (scraperId) {
    // Clear specific scraper cache by finding keys that start with scraperId
    const keys = scraperCache.keys();
    const scraperKeys = keys.filter(key => key.startsWith(`${scraperId}:`));
    scraperKeys.forEach(key => scraperCache.del(key));
    console.log(`Cleared cache for scraper: ${scraperId}`);
  } else {
    // Clear all cache
    scraperCache.flushAll();
    console.log('Cleared all scraper caches');
  }
};

// Initialize schedules when this module is loaded
initializeSchedules();

module.exports = {
  registerActiveEvent,
  triggerScraper,
  clearCache,
  shouldRunHighFrequency
};
