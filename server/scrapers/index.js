/**
 * Main scraper module that orchestrates the scraping of race results
 * from various websites.
 */

const path = require('path');
const fs = require('fs');

// Import all site-specific scrapers
const scrapers = {};
const sitesDir = path.join(__dirname, 'sites');

// Dynamically load all scrapers from the sites directory
fs.readdirSync(sitesDir).forEach(file => {
  if (file.endsWith('.js')) {
    const scraperName = file.replace('.js', '');
    scrapers[scraperName] = require(path.join(sitesDir, file));
  }
});

// Register the new Boston Marathon V2 scraper
scrapers['bostonmarathonv2'] = require('./v2/bostonMarathonScraper');

/**
 * Scrape race results from a specific source
 * @param {string} source - The source to scrape from (e.g., 'worldathletics', 'bostonmarathon')
 * @param {Object} options - Options for the scraper
 * @returns {Promise<Array>} - Array of race results
 */
async function scrapeResults(source, options = {}) {
  if (!scrapers[source]) {
    throw new Error(`Scraper for source "${source}" not found`);
  }
  
  console.log(`Starting scrape for ${source} with options:`, options);
  
  try {
    // Create an instance of the scraper class
    const ScraperClass = scrapers[source];
    const scraperInstance = new ScraperClass();
    
    const results = await scraperInstance.scrape(options);
    console.log(`Completed scrape for ${source}, found ${results.length} results`);
    return results;
  } catch (error) {
    console.error(`Error scraping ${source}:`, error);
    throw error;
  }
}

/**
 * List all available scrapers
 * @returns {Array<string>} - Array of available scraper names
 */
function listScrapers() {
  return Object.keys(scrapers);
}

module.exports = {
  scrapeResults,
  listScrapers
};
