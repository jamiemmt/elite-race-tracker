const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Result = require('./server/models/Result');
const Race = require('./server/models/Race');
const Athlete = require('./server/models/Athlete');

async function cleanupArtifacts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elite-race-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    let deletedResults = 0;
    let deletedRaces = 0;
    let deletedAthletes = 0;

    // Step 1: Remove parsing artifacts - athletes with corrupted names
    console.log('Removing parsing artifacts...');
    const corruptedAthletePatterns = [
      /^s \d+m/,  // "s 200WHAT", "s 3000mIn"
      /^\d+m/,    // starts with distance
      /Steeplechase/,  // "SteeplechaseFaith Cherotich"
      /finished$/,     // "Bromell finished"
      /takes$/,        // "Britt takes"
      /^[A-Z]+$/,      // All caps single words
      /^\d+$/,         // Just numbers
      /\d+:\d+$/       // ends with time format
    ];

    for (const pattern of corruptedAthletePatterns) {
      const corruptedAthletes = await Athlete.find({ name: { $regex: pattern } });
      const athleteIds = corruptedAthletes.map(a => a._id);
      
      if (athleteIds.length > 0) {
        const resultCount = await Result.deleteMany({ athlete: { $in: athleteIds } });
        await Athlete.deleteMany({ _id: { $in: athleteIds } });
        deletedAthletes += corruptedAthletes.length;
        deletedResults += resultCount.deletedCount;
        console.log(`Deleted ${corruptedAthletes.length} corrupted athletes and ${resultCount.deletedCount} results matching pattern: ${pattern}`);
      }
    }

    // Step 2: Remove fake Eugene Diamond League races
    console.log('Removing fake Eugene races...');
    const eugeneRaces = await Race.find({
      $or: [
        { name: { $regex: /eugene/i } },
        { venue: { $regex: /eugene/i } }
      ]
    });
    
    if (eugeneRaces.length > 0) {
      const eugeneRaceIds = eugeneRaces.map(r => r._id);
      const eugeneResults = await Result.deleteMany({ race: { $in: eugeneRaceIds } });
      await Race.deleteMany({ _id: { $in: eugeneRaceIds } });
      deletedRaces += eugeneRaces.length;
      deletedResults += eugeneResults.deletedCount;
      console.log(`Deleted ${eugeneRaces.length} fake Eugene races and ${eugeneResults.deletedCount} results`);
    }

    // Step 3: Remove Jakob Ingebrigtsen from fake Diamond League Final 2025 events
    console.log('Removing Jakob Ingebrigtsen from fake Diamond League Final 2025 events...');
    const jakobAthlete = await Athlete.findOne({ name: 'Jakob Ingebrigtsen' });
    if (jakobAthlete) {
      const fakeJakobRaces = await Race.find({
        name: { $regex: /Diamond League Final 2025.*(?:100m|5000m)/ }
      });
      
      if (fakeJakobRaces.length > 0) {
        const fakeRaceIds = fakeJakobRaces.map(r => r._id);
        const jakobFakeResults = await Result.deleteMany({
          athlete: jakobAthlete._id,
          race: { $in: fakeRaceIds }
        });
        deletedResults += jakobFakeResults.deletedCount;
        console.log(`Deleted ${jakobFakeResults.deletedCount} fake Jakob Ingebrigtsen results from Diamond League Final 2025`);
      }
    }

    // Step 4: Remove results with corrupted times
    console.log('Removing results with corrupted times...');
    const corruptedTimeResults = await Result.find({
      $or: [
        { formattedTime: { $regex: /\d+\.\d+\.\d+:\d+/ } }, // "20.14.3:30"
        { formattedTime: { $regex: /^\d+$/ } },              // Just numbers like "400"
        { formattedTime: { $regex: /\d+:\d+$/ } },           // Incomplete times
        { formattedTime: { $regex: /\.$/ } }                 // Ends with period
      ]
    });

    if (corruptedTimeResults.length > 0) {
      await Result.deleteMany({ _id: { $in: corruptedTimeResults.map(r => r._id) } });
      deletedResults += corruptedTimeResults.length;
      console.log(`Deleted ${corruptedTimeResults.length} results with corrupted times`);
    }

    // Step 5: Remove races with no results left
    console.log('Removing orphaned races...');
    const racesWithoutResults = await Race.find({
      _id: { $nin: await Result.distinct('race') }
    });

    if (racesWithoutResults.length > 0) {
      await Race.deleteMany({ _id: { $in: racesWithoutResults.map(r => r._id) } });
      deletedRaces += racesWithoutResults.length;
      console.log(`Deleted ${racesWithoutResults.length} orphaned races`);
    }

    // Step 6: Remove athletes with no results left
    console.log('Removing orphaned athletes...');
    const athletesWithoutResults = await Athlete.find({
      _id: { $nin: await Result.distinct('athlete') }
    });

    if (athletesWithoutResults.length > 0) {
      await Athlete.deleteMany({ _id: { $in: athletesWithoutResults.map(a => a._id) } });
      deletedAthletes += athletesWithoutResults.length;
      console.log(`Deleted ${athletesWithoutResults.length} orphaned athletes`);
    }

    console.log('\n=== CLEANUP COMPLETE ===');
    console.log(`Total deleted: ${deletedResults} results, ${deletedRaces} races, ${deletedAthletes} athletes`);
    console.log('Actions completed:');
    console.log('- Removed parsing artifacts from athlete names');
    console.log('- Deleted fake Eugene Diamond League races');
    console.log('- Removed Jakob Ingebrigtsen from fake Diamond League Final 2025 events');
    console.log('- Cleaned up corrupted time formats');
    console.log('- Removed orphaned races and athletes');
    
  } catch (error) {
    console.error('Error in cleanup artifacts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupArtifacts();
