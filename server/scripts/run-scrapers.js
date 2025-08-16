/**
 * Production script to run all scrapers
 * This script is designed to be run by Heroku Scheduler
 * Modified with additional debugging output
 */

require('dotenv').config();
const mongoose = require('mongoose');
const scrapers = require('../scrapers');

// Import all scraper modules
const bostonMarathon = require('../scrapers/sites/bostonmarathon');
const chicagoMarathon = require('../scrapers/sites/chicagomarathon');
const nycMarathon = require('../scrapers/sites/nycmarathon');
const londonMarathon = require('../scrapers/sites/londonmarathon');
const berlinMarathon = require('../scrapers/sites/berlinmarathon');
const tokyoMarathon = require('../scrapers/sites/tokyomarathon');
const worldAthletics = require('../scrapers/sites/worldathletics');
const aiu = require('../scrapers/sites/athleticsintegrity');

async function testScraper(name, scraperModule) {
  console.log(`\n--- Testing ${name} scraper ---`);
  try {
    // Handle both class exports and instance exports
    const scraperInstance = typeof scraperModule === 'function' ? new scraperModule() : scraperModule;
    
    // Try to call scrape() or fallback to scrapeResults()
    let results;
    if (typeof scraperInstance.scrape === 'function') {
      console.log(`Using scrape() method for ${name}`);
      results = await scraperInstance.scrape({});
    } else if (typeof scraperInstance.scrapeResults === 'function') {
      console.log(`Using scrapeResults() method for ${name}`);
      results = await scraperInstance.scrapeResults({});
    } else {
      throw new Error(`No scrape or scrapeResults method found for ${name}`);
    }
    
    console.log(`✅ ${name} scraper successful - found ${results.length} results`);
    if (results.length > 0) {
      console.log(`Sample result: ${JSON.stringify(results[0], null, 2)}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ ${name} scraper failed:`, error);
    return false;
  }
}

async function runScrapers() {
  try {
    if (process.env.MONGO_URI) {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');
    } else {
      console.log('No MongoDB URI found, running in test mode without database');
    }
    
    console.log('\n=== STARTING SCRAPER VERIFICATION ===');
    
    // Test each scraper
    const scraperResults = {};
    
    scraperResults.boston = await testScraper('Boston Marathon', bostonMarathon);
    scraperResults.chicago = await testScraper('Chicago Marathon', chicagoMarathon);
    scraperResults.nyc = await testScraper('NYC Marathon', nycMarathon);
    scraperResults.london = await testScraper('London Marathon', londonMarathon);
    scraperResults.berlin = await testScraper('Berlin Marathon', berlinMarathon);
    scraperResults.tokyo = await testScraper('Tokyo Marathon', tokyoMarathon);
    scraperResults.worldAthletics = await testScraper('World Athletics', worldAthletics);
    scraperResults.aiu = await testScraper('Athletics Integrity Unit', aiu);
    
    console.log('\n=== SCRAPER TEST RESULTS SUMMARY ===');
    Object.entries(scraperResults).forEach(([name, success]) => {
      console.log(`${success ? '✅' : '❌'} ${name}: ${success ? 'Passed' : 'Failed'}`);
    });
    
    const totalTests = Object.keys(scraperResults).length;
    const passedTests = Object.values(scraperResults).filter(success => success).length;
    
    console.log(`\n${passedTests}/${totalTests} scrapers working properly (${Math.round(passedTests/totalTests*100)}%)`); 
    
  } catch (error) {
    console.error('Error running scrapers:', error);
  } finally {
    // Always disconnect from database if connected
    if (mongoose.connection.readyState) {
      console.log('\nDisconnecting from MongoDB...');
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the scrapers
runScrapers();
