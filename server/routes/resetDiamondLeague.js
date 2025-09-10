const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');
const { processResults } = require('../controllers/scraperController');

/**
 * POST /api/reset-diamond-league
 * Clear all Diamond League data and reload with corrected scraper
 */
router.post('/', async (req, res) => {
  try {
    console.log('Starting Diamond League reset process...');
    
    // Step 1: Delete all Diamond League results
    const diamondLeagueRaces = await Race.find({
      name: { $regex: /diamond league/i }
    });
    
    const raceIds = diamondLeagueRaces.map(race => race._id);
    
    await Result.deleteMany({ race: { $in: raceIds } });
    await Race.deleteMany({ _id: { $in: raceIds } });
    
    console.log(`Cleared ${diamondLeagueRaces.length} Diamond League races`);
    
    // Step 2: Load corrected scraper
    const DiamondLeague2025Corrected = require('../scrapers/sites/diamondLeague2025Corrected');
    console.log('Running corrected scraper...');
    
    const results = await DiamondLeague2025Corrected.scrape({ topN: 50 });
    console.log(`Corrected scraper returned ${results.length} results`);
    
    // Step 3: Process results
    const summary = await processResults(results, 'diamondLeague2025Corrected', { topN: 50 });
    console.log('Results processed successfully');
    
    res.json({
      success: true,
      message: 'Diamond League data reset with corrected results (Jakob Ingebrigtsen removed)',
      summary: {
        clearedRaces: diamondLeagueRaces.length,
        totalResults: results.length,
        processedResults: summary.processedResults,
        newAthletes: summary.newAthletes,
        newRaces: summary.newRaces,
        newResults: summary.newResults,
        errors: summary.errors || []
      }
    });
    
  } catch (error) {
    console.error('Error in Diamond League reset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
