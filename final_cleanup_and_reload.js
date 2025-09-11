const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Result = require('./server/models/Result');
const Race = require('./server/models/Race');
const Athlete = require('./server/models/Athlete');
const { processResults } = require('./server/controllers/scraperController');

async function finalCleanupAndReload() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elite-race-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Step 1: Nuclear option - delete everything
    console.log('Step 1: Clearing all data...');
    await Result.deleteMany({});
    await Race.deleteMany({});
    await Athlete.deleteMany({});
    console.log('All data cleared');
    
    // Step 2: Load ONLY the accurate Diamond League Final 2025 results
    console.log('Step 2: Loading accurate Diamond League Final 2025 results...');
    const DiamondLeague2025Accurate = require('./server/scrapers/sites/diamondLeague2025Accurate');
    
    const results = await DiamondLeague2025Accurate.scrape({ topN: 100 });
    console.log(`Accurate scraper returned ${results.length} results`);
    
    // Step 3: Process results
    console.log('Step 3: Processing results...');
    const summary = await processResults(results, 'diamondLeague2025Accurate', { topN: 100 });
    console.log(`Processed ${summary.processedResults} results successfully`);
    
    // Step 4: Verify clean data
    console.log('Step 4: Verifying clean data...');
    const totalResults = await Result.countDocuments();
    const totalRaces = await Race.countDocuments();
    const totalAthletes = await Athlete.countDocuments();
    
    console.log('\n=== FINAL DATABASE STATE ===');
    console.log(`Total Results: ${totalResults}`);
    console.log(`Total Races: ${totalRaces}`);
    console.log(`Total Athletes: ${totalAthletes}`);
    
    // Check for any remaining artifacts
    const artifactAthletes = await Athlete.find({
      $or: [
        { name: { $regex: /^s \d+m/ } },
        { name: { $regex: /finished$/ } },
        { name: { $regex: /Steeplechase/ } },
        { name: { $regex: /takes$/ } }
      ]
    });
    
    if (artifactAthletes.length === 0) {
      console.log('✅ No parsing artifacts found');
    } else {
      console.log(`❌ Found ${artifactAthletes.length} artifact athletes still remaining`);
    }
    
    // Check for Jakob Ingebrigtsen in fake events
    const jakobInFakeEvents = await Result.find({
      athlete: { $in: await Athlete.find({ name: 'Jakob Ingebrigtsen' }).distinct('_id') }
    }).populate('race').populate('athlete');
    
    const fakeJakobEvents = jakobInFakeEvents.filter(r => 
      r.race.name.includes('Diamond League Final 2025') && 
      (r.race.name.includes('100m') || r.race.name.includes('5000m'))
    );
    
    if (fakeJakobEvents.length === 0) {
      console.log('✅ No fake Jakob Ingebrigtsen events found');
    } else {
      console.log(`❌ Found ${fakeJakobEvents.length} fake Jakob Ingebrigtsen events`);
    }
    
    // Check for Eugene races
    const eugeneRaces = await Race.find({
      $or: [
        { name: { $regex: /eugene/i } },
        { venue: { $regex: /eugene/i } }
      ]
    });
    
    if (eugeneRaces.length === 0) {
      console.log('✅ No fake Eugene races found');
    } else {
      console.log(`❌ Found ${eugeneRaces.length} fake Eugene races`);
    }
    
    console.log('\n=== CLEANUP COMPLETE ===');
    console.log('Database now contains only accurate Diamond League Final 2025 results');
    
  } catch (error) {
    console.error('Error in final cleanup and reload:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the final cleanup
finalCleanupAndReload();
