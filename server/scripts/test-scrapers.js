/**
 * Test script for scrapers
 * Run with: node scripts/test-scrapers.js [scraper-name] [options]
 */

const scrapers = require('../scrapers');
const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const scraperName = args[0];

async function runTest() {
  try {
    // If no scraper name provided, list available scrapers
    if (!scraperName) {
      console.log('Available scrapers:');
      const availableScrapers = scrapers.listScrapers();
      availableScrapers.forEach(scraper => console.log(`- ${scraper}`));
      console.log('\nUsage: node scripts/test-scrapers.js [scraper-name] [options]');
      console.log('Example: node scripts/test-scrapers.js worldathletics');
      console.log('Example: node scripts/test-scrapers.js bostonmarathon --year=2023');
      console.log('Use "all" to run all available scrapers');
      return;
    }

    // Parse options from command line
    const options = {};
    args.slice(1).forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value;
      }
    });

    console.log(`Running ${scraperName} scraper with options:`, options);
    
    if (scraperName.toLowerCase() === 'all') {
      // Run all available scrapers
      const availableScrapers = scrapers.listScrapers();
      console.log(`Running all ${availableScrapers.length} available scrapers...`);
      
      // Default options for each scraper
      const scraperDefaults = {
        worldathletics: { allCompetitions: true },
        bostonmarathon: { year: 2023 },
        athleticsintegrity: {}
      };
      
      let totalResults = 0;
      for (const scraper of availableScrapers) {
        console.log(`\n=== Testing ${scraper} scraper ===`);
        
        // Merge default options with user-provided options
        const scraperOptions = { 
          ...scraperDefaults[scraper] || {}, 
          ...options 
        };
        console.log(`Using options for ${scraper}:`, scraperOptions);
        
        const results = await scrapers.scrapeResults(scraper, scraperOptions);
        totalResults += results.length;
        
        // Save results to a JSON file
        const outputDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const outputFile = path.join(outputDir, `${scraper}-results.json`);
        fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
        
        console.log(`Scraping complete for ${scraper}. Found ${results.length} results.`);
        console.log(`Results saved to ${outputFile}`);
        
        // Print a sample of the results
        if (results.length > 0) {
          console.log('\nSample result:');
          console.log(JSON.stringify(results[0], null, 2));
        }
      }
      
      console.log(`\nAll scrapers completed. Total results: ${totalResults}`);
    } else {
      // Run the scraper
      const results = await scrapers.scrapeResults(scraperName, options);
      
      // Save results to a JSON file
      const outputDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const outputFile = path.join(outputDir, `${scraperName}-results.json`);
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
      
      console.log(`Scraping complete. Found ${results.length} results.`);
      console.log(`Results saved to ${outputFile}`);
      
      // Print a sample of the results
      if (results.length > 0) {
        console.log('\nSample result:');
        console.log(JSON.stringify(results[0], null, 2));
      }
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

runTest();
