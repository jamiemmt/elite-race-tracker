const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

/**
 * DELETE /api/cleanup/diamond-league
 * Clear all Diamond League results, races, and orphaned athletes
 */
router.delete('/diamond-league', async (req, res) => {
  try {
    // Find all Diamond League races
    const diamondLeagueRaces = await Race.find({
      name: { $regex: /diamond league/i }
    });
    
    console.log(`Found ${diamondLeagueRaces.length} Diamond League races`);
    
    // Get race IDs
    const raceIds = diamondLeagueRaces.map(race => race._id);
    
    // Delete all results for these races
    const deletedResults = await Result.deleteMany({
      race: { $in: raceIds }
    });
    
    console.log(`Deleted ${deletedResults.deletedCount} Diamond League results`);
    
    // Delete the races themselves
    const deletedRaces = await Race.deleteMany({
      _id: { $in: raceIds }
    });
    
    console.log(`Deleted ${deletedRaces.deletedCount} Diamond League races`);
    
    // Clean up orphaned athletes (athletes with no results)
    const athletesWithResults = await Result.distinct('athlete');
    const orphanedAthletes = await Athlete.find({
      _id: { $nin: athletesWithResults }
    });
    
    let deletedAthletes = 0;
    if (orphanedAthletes.length > 0) {
      const deleteResult = await Athlete.deleteMany({
        _id: { $nin: athletesWithResults }
      });
      deletedAthletes = deleteResult.deletedCount;
      console.log(`Deleted ${deletedAthletes} orphaned athletes`);
    }
    
    res.json({
      success: true,
      summary: {
        deletedResults: deletedResults.deletedCount,
        deletedRaces: deletedRaces.deletedCount,
        deletedAthletes: deletedAthletes,
        message: 'Diamond League data cleanup completed successfully'
      }
    });
    
  } catch (error) {
    console.error('Error clearing Diamond League results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/cleanup/year/:year
 * Remove all races and results in the specified year, then delete orphaned non-banned athletes
 */
router.delete('/year/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return res.status(400).json({ success: false, error: 'Invalid year' });
    }

    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    // Find all races in the given year
    const racesInYear = await Race.find({ date: { $gte: start, $lte: end } });
    const raceIds = racesInYear.map(r => r._id);

    // Delete all results for these races
    const deletedResults = await Result.deleteMany({ race: { $in: raceIds } });
    // Delete the races
    const deletedRaces = await Race.deleteMany({ _id: { $in: raceIds } });

    // Clean orphaned non-banned athletes
    const athletesWithResults = await Result.distinct('athlete');
    const orphanedNonBanned = await Athlete.find({ _id: { $nin: athletesWithResults }, isBanned: { $ne: true } });
    let deletedAthletes = 0;
    if (orphanedNonBanned.length > 0) {
      const del = await Athlete.deleteMany({ _id: { $in: orphanedNonBanned.map(a => a._id) } });
      deletedAthletes = del.deletedCount || 0;
    }

    res.json({
      success: true,
      summary: {
        year,
        racesFound: racesInYear.length,
        deletedResults: deletedResults.deletedCount || 0,
        deletedRaces: deletedRaces.deletedCount || 0,
        deletedAthletes,
      }
    });
  } catch (error) {
    console.error('Error clearing year results:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
