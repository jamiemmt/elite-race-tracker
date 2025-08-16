/**
 * Boston Marathon Scraper V2 Test
 * 
 * This script tests the BostonMarathonScraperV2 to verify it correctly extracts results
 * from the Boston Marathon website for men, women, and nonbinary categories.
 */

const bostonMarathonScraper = require('../scrapers/v2/bostonMarathonScraper');

async function testScraper() {
  try {
    console.log('Testing Boston Marathon Scraper V2...');
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Test with a smaller limit for quicker testing
    const results = await bostonMarathonScraper.scrape({ 
      year: currentYear,
      limit: 10 // Only get top 10 from each category for testing
    });
    
    console.log(`Total results: ${results.length}`);
    
    // Group results by gender
    const maleResults = results.filter(r => r.athlete.gender === 'Male');
    const femaleResults = results.filter(r => r.athlete.gender === 'Female');
    const nonbinaryResults = results.filter(r => r.athlete.gender === 'Nonbinary');
    
    console.log(`Male results: ${maleResults.length}`);
    console.log(`Female results: ${femaleResults.length}`);
    console.log(`Nonbinary results: ${nonbinaryResults.length}`);
    
    // Check that we have all required fields for database validation
    let validResults = 0;
    let invalidResults = 0;
    
    for (const result of results) {
      // Check for required fields
      if (
        result.athlete && 
        result.athlete.name && 
        result.athlete.gender && 
        result.race && 
        result.race.name &&
        result.race.date &&
        result.race.distance &&
        result.race.distanceUnit &&
        result.race.category &&
        result.race.gender &&
        result.formattedTime && 
        typeof result.finishTime === 'number'
      ) {
        validResults++;
      } else {
        invalidResults++;
        console.log('Invalid result:', JSON.stringify(result, null, 2));
      }
    }
    
    console.log(`Valid results: ${validResults}`);
    console.log(`Invalid results: ${invalidResults}`);
    
    // Display sample results
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
    
    console.log('\nTest completed.');
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
testScraper();
