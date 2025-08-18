/**
 * Verify scrapers return results script
 * This script tests each scraper individually with appropriate parameters
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set up environment to simulate Heroku
process.env.DYNO = 'verify-test';

// Get the scrapers directory
const scrapersDir = path.join(__dirname, '../scrapers/sites');

// Function to test a single scraper
async function testScraper(scraperPath, scraperName, options = {}) {
  console.log(`\n=== Testing ${scraperName} scraper ===`);
  
  try {
    // Dynamically import the scraper
    let scraper;
    try {
      scraper = require(scraperPath);
      console.log(`Successfully loaded ${scraperName} scraper module`);
    } catch (err) {
      console.error(`Error loading scraper module ${scraperName}:`, err.message);
      return { success: false, error: err.message, results: [] };
    }
    
    // Run the scraper
    console.log(`Running ${scraperName} with options:`, options);
    const startTime = Date.now();
    
    let results;
    try {
      results = await scraper.scrape(options);
      const duration = (Date.now() - startTime) / 1000;
      
      console.log(`✅ ${scraperName} returned ${results.length} results in ${duration.toFixed(2)}s`);
      
      if (results.length > 0) {
        console.log('First result sample:');
        console.log(JSON.stringify(results[0], null, 2).substring(0, 500) + '...');
      } else {
        console.log('⚠️ No results returned');
      }
      
      return { 
        success: true, 
        count: results.length, 
        duration: duration.toFixed(2),
        results
      };
    } catch (err) {
      console.error(`❌ Error running ${scraperName} scraper:`, err.message);
      return { success: false, error: err.message, results: [] };
    }
  } catch (err) {
    console.error(`❌ Critical error with ${scraperName}:`, err.message);
    return { success: false, error: err.message, results: [] };
  }
}

// Main function to test all scrapers
async function testAllScrapers() {
  console.log('=== SCRAPER VERIFICATION TEST ===');
  console.log('Testing all scrapers to verify they return results\n');
  
  const results = {};
  let totalSuccessful = 0;
  
  // Get all scrapers
  const scraperFiles = fs.readdirSync(scrapersDir).filter(file => file.endsWith('.js'));
  
  // Options for each scraper
  const scraperOptions = {
    'bostonmarathon.js': { year: 2023 },
    'tokyomarathon.js': { year: 2023 },
    'worldathletics.js': { allCompetitions: true },
    'berlinmarathon.js': { year: 2023 },
    'chicagomarathon.js': { year: 2023 },
    'londonmarathon.js': { year: 2023 },
    'newyorkmarathon.js': { year: 2023 },
    'athleticsintegrity.js': {},
  };
  
  // Test each scraper
  for (const file of scraperFiles) {
    const scraperPath = path.join(scrapersDir, file);
    const scraperName = file.replace('.js', '');
    const options = scraperOptions[file] || {};
    
    const result = await testScraper(scraperPath, scraperName, options);
    results[scraperName] = result;
    
    if (result.success && result.count > 0) {
      totalSuccessful++;
    }
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total scrapers tested: ${scraperFiles.length}`);
  console.log(`Successful scrapers: ${totalSuccessful}/${scraperFiles.length}`);
  
  for (const [name, result] of Object.entries(results)) {
    const status = result.success ? (result.count > 0 ? '✅' : '⚠️') : '❌';
    const details = result.success 
      ? `${result.count} results in ${result.duration}s` 
      : `Error: ${result.error}`;
    console.log(`${status} ${name}: ${details}`);
  }
  
  return results;
}

// Run the tests
testAllScrapers()
  .then(results => {
    // Save results to a JSON file for reference
    const outputDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'scraper-verification-results.json');
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${outputFile}`);
  })
  .catch(err => {
    console.error('Critical error running tests:', err);
  });
