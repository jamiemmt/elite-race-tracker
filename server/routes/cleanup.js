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

module.exports = router;
