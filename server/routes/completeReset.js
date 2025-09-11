const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

/**
 * POST /api/complete-reset
 * Clear ALL database data completely
 */
router.post('/', async (req, res) => {
  try {
    console.log('Starting complete database reset...');
    
    // Delete everything
    const deletedResults = await Result.deleteMany({});
    const deletedRaces = await Race.deleteMany({});
    const deletedAthletes = await Athlete.deleteMany({});
    
    console.log(`Deleted ${deletedResults.deletedCount} results`);
    console.log(`Deleted ${deletedRaces.deletedCount} races`);
    console.log(`Deleted ${deletedAthletes.deletedCount} athletes`);
    
    res.json({
      success: true,
      message: 'Database completely cleared',
      summary: {
        deletedResults: deletedResults.deletedCount,
        deletedRaces: deletedRaces.deletedCount,
        deletedAthletes: deletedAthletes.deletedCount
      }
    });
    
  } catch (error) {
    console.error('Error in complete reset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
