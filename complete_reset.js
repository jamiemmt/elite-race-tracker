const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Result = require('./server/models/Result');
const Race = require('./server/models/Race');
const Athlete = require('./server/models/Athlete');
const { processResults } = require('./server/controllers/scraperController');

async function completeReset() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elite-race-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Step 1: Clear ALL data completely
    console.log('Clearing ALL database data...');
    await Result.deleteMany({});
    await Race.deleteMany({});
    await Athlete.deleteMany({});
    console.log('Database completely cleared');
    
    // Step 2: Load ONLY the corrected scraper
    const DiamondLeague2025Corrected = require('./server/scrapers/sites/diamondLeague2025Corrected');
    console.log('Running corrected Diamond League scraper (Jakob removed)...');
    
    const results = await DiamondLeague2025Corrected.scrape({ topN: 50 });
    console.log(`Corrected scraper returned ${results.length} results`);
    
    // Step 3: Process results
    const summary = await processResults(results, 'diamondLeague2025Corrected', { topN: 50 });
    console.log(`Processed ${summary.processedResults} results successfully`);
    
    console.log('Complete reset finished - only corrected Diamond League data loaded');
    
  } catch (error) {
    console.error('Error in complete reset:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the complete reset
completeReset();
