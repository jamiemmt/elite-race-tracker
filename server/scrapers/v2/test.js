/**
 * Test script for Boston Marathon V2 scraper
 */

const bostonMarathonScraper = require('./bostonMarathonScraper');

async function testBostonMarathonScraper() {
  try {
    console.log('Testing Boston Marathon V2 scraper...');
    
    // Set options for the scraper (year and limit)
    const options = {
      year: 2025, // Adjust to the current year
      limit: 100 // Get top 100 results per category
    };
    
    // Run the scraper
    const results = await bostonMarathonScraper.scrape(options);
    
    // Print summary of results
    console.log(`Successfully scraped ${results.length} results`);
    
    // Count results by category
    const maleResults = results.filter(r => r.athlete.gender === 'Male');
    const femaleResults = results.filter(r => r.athlete.gender === 'Female');
    const nonbinaryResults = results.filter(r => r.athlete.gender === 'Nonbinary');
    
    console.log(`Male results: ${maleResults.length}`);
    console.log(`Female results: ${femaleResults.length}`);
    console.log(`Nonbinary results: ${nonbinaryResults.length}`);
    
    // Print sample results (first result from each category)
    if (maleResults.length > 0) {
      console.log('\nSample male result:');
      console.log(JSON.stringify(maleResults[0], null, 2));
    }
    
    if (femaleResults.length > 0) {
      console.log('\nSample female result:');
      console.log(JSON.stringify(femaleResults[0], null, 2));
    }
    
    if (nonbinaryResults.length > 0) {
      console.log('\nSample nonbinary result:');
      console.log(JSON.stringify(nonbinaryResults[0], null, 2));
    }
  } catch (error) {
    console.error('Error testing Boston Marathon scraper:', error);
  }
}

// Run the test
testBostonMarathonScraper();
