const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

/**
 * POST /api/cleanup-artifacts
 * Remove parsing artifacts, fake races, and corrupted entries
 */
router.post('/', async (req, res) => {
  try {
    console.log('Starting cleanup of parsing artifacts and fake races...');
    
    let deletedResults = 0;
    let deletedRaces = 0;
    let deletedAthletes = 0;

    // Step 1: Remove parsing artifacts - athletes with corrupted names
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
        await Result.deleteMany({ athlete: { $in: athleteIds } });
        await Athlete.deleteMany({ _id: { $in: athleteIds } });
        deletedAthletes += corruptedAthletes.length;
        console.log(`Deleted ${corruptedAthletes.length} corrupted athletes matching pattern: ${pattern}`);
      }
    }

    // Step 2: Remove fake Eugene Diamond League races
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
    const racesWithoutResults = await Race.find({
      _id: { $nin: await Result.distinct('race') }
    });

    if (racesWithoutResults.length > 0) {
      await Race.deleteMany({ _id: { $in: racesWithoutResults.map(r => r._id) } });
      deletedRaces += racesWithoutResults.length;
      console.log(`Deleted ${racesWithoutResults.length} orphaned races`);
    }

    // Step 6: Remove athletes with no results left
    const athletesWithoutResults = await Athlete.find({
      _id: { $nin: await Result.distinct('athlete') }
    });

    if (athletesWithoutResults.length > 0) {
      await Athlete.deleteMany({ _id: { $in: athletesWithoutResults.map(a => a._id) } });
      deletedAthletes += athletesWithoutResults.length;
      console.log(`Deleted ${athletesWithoutResults.length} orphaned athletes`);
    }

    res.json({
      success: true,
      message: 'Cleanup completed - removed parsing artifacts, fake races, and corrupted entries',
      summary: {
        deletedResults,
        deletedRaces,
        deletedAthletes,
        actions: [
          'Removed parsing artifacts from athlete names',
          'Deleted fake Eugene Diamond League races',
          'Removed Jakob Ingebrigtsen from fake Diamond League Final 2025 events',
          'Cleaned up corrupted time formats',
          'Removed orphaned races and athletes'
        ]
      }
    });
    
  } catch (error) {
    console.error('Error in cleanup artifacts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
