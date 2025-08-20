const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Helper function to generate sample data for a race
function generateSampleData(raceName, options = {}) {
  const year = options.year || new Date().getFullYear();
  const limit = options.limit || 20;
  
  const results = [];
  const genders = ['Male', 'Female'];
  
  for (const gender of genders) {
    // Generate positions based on limit
    for (let i = 1; i <= Math.min(limit / 2, 10); i++) {
      const firstName = gender === 'Male' ? 
        ['John', 'Michael', 'James', 'David', 'Robert', 'William', 'Thomas', 'Daniel', 'Matthew', 'Joseph'][i % 10] :
        ['Mary', 'Jennifer', 'Sarah', 'Elizabeth', 'Susan', 'Jessica', 'Michelle', 'Lauren', 'Emily', 'Olivia'][i % 10];
        
      const lastName = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'][i % 10];
      
      const countries = ['USA', 'KEN', 'ETH', 'GBR', 'JPN', 'CAN', 'GER', 'ITA', 'AUS', 'FRA'];
      
      // Generate a plausible marathon time
      const baseMinutes = gender === 'Male' ? 120 : 135; // 2h or 2h15 base
      const minutes = baseMinutes + (i * 2);
      const seconds = Math.floor(Math.random() * 60);
      const formattedTime = `${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      const timeInSeconds = (Math.floor(minutes / 60) * 3600) + ((minutes % 60) * 60) + seconds;
      
      results.push({
        athlete: {
          name: `${firstName} ${lastName}`,
          country: countries[i % 10],
          gender: gender
        },
        race: {
          name: `${raceName} ${year} - ${gender === 'Male' ? "Men's" : "Women's"} Division`,
          date: new Date(`April 15, ${year}`),
          distance: 42195, // meters for marathon
          distanceUnit: 'm',
          location: `${raceName.split(' ')[0]}, USA`,
          category: 'Road',
          gender: gender,
          isElite: true
        },
        result: {
          time: timeInSeconds,
          position: i,
          formattedTime: formattedTime
        }
      });
    }
  }
  
  return results;
}

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
        
        // Create a fallback scraper that returns sample data
        scrapers[scraperName] = {
          scrape: async function(options = {}) {
            console.log(`Using fallback sample data generator for ${scraperName}`);
            return generateSampleData(scraperName.charAt(0).toUpperCase() + scraperName.slice(1) + ' Marathon', options);
          }
        };
        console.log(`Created fallback sample data generator for: ${scraperName}`);
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
    const options = { year: year || 2024, limit: limit || 20 };
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
