const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Import all scrapers dynamically
const scrapersDir = path.join(__dirname, '../scrapers/sites');
let scrapers = {};

// Load all scrapers
try {
  fs.readdirSync(scrapersDir).forEach(file => {
    if (file.endsWith('.js')) {
      const scraperName = file.replace('.js', '');
      try {
        // Try to safely load the scraper module
        const scraperModule = require(path.join(scrapersDir, file));
        scrapers[scraperName] = scraperModule;
        console.log(`Successfully loaded scraper: ${scraperName}`);
      } catch (err) {
        console.error(`Error loading scraper ${file}:`, err);
        // Create a dummy scraper that returns empty results
        scrapers[scraperName] = class DummyScraper {
          async scrape(options = {}) {
            console.log(`Using fallback dummy scraper for ${scraperName}`);
            return [];
          }
        };
      }
    }
  });
} catch (error) {
  console.error('Error loading scrapers directory:', error);
}

// List all available scrapers
router.get('/', (req, res) => {
  const availableScrapers = Object.keys(scrapers).map(name => ({
    name,
    url: `/api/scrapers/${name}`
  }));
  
  res.json({
    availableScrapers,
    count: availableScrapers.length,
    message: 'Use the URL to run a specific scraper'
  });
});

// Run a specific scraper
router.get('/:name', async (req, res) => {
  const { name } = req.params;
  const { year, limit } = req.query;
  
  if (!scrapers[name]) {
    return res.status(404).json({ error: `Scraper '${name}' not found` });
  }
  
  try {
    const options = { year: year || new Date().getFullYear(), limit: limit || 20 };
    const scraperInstance = typeof scrapers[name] === 'function' ? new scrapers[name]() : scrapers[name];
    
    let results;
    if (typeof scraperInstance.scrape === 'function') {
      results = await scraperInstance.scrape(options);
    } else if (typeof scraperInstance.scrapeResults === 'function') {
      results = await scraperInstance.scrapeResults(options);
    } else {
      throw new Error(`No scrape or scrapeResults method found for ${name}`);
    }
    
    res.json({
      scraper: name,
      options,
      resultsCount: results.length,
      results
    });
  } catch (error) {
    console.error(`Error running ${name} scraper:`, error);
    res.status(500).json({
      scraper: name,
      error: error.message || 'An error occurred while running the scraper',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack
    });
  }
});

module.exports = router;
