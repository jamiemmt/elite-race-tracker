const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

/**
 * DELETE /api/admin/clear-all
 * Clear all results, races, and athletes from database
 */
router.delete('/clear-all', async (req, res) => {
  try {
    // Delete all results
    const deletedResults = await Result.deleteMany({});
    console.log(`Deleted ${deletedResults.deletedCount} results`);
    
    // Delete all races
    const deletedRaces = await Race.deleteMany({});
    console.log(`Deleted ${deletedRaces.deletedCount} races`);
    
    // Delete all athletes
    const deletedAthletes = await Athlete.deleteMany({});
    console.log(`Deleted ${deletedAthletes.deletedCount} athletes`);
    
    res.json({
      success: true,
      summary: {
        deletedResults: deletedResults.deletedCount,
        deletedRaces: deletedRaces.deletedCount,
        deletedAthletes: deletedAthletes.deletedCount,
        message: 'All data cleared successfully'
      }
    });
    
  } catch (error) {
    console.error('Error clearing all data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
