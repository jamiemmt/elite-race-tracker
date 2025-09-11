const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');
const { processResults } = require('../controllers/scraperController');

/**
 * POST /api/nuke-database-and-reload
 * Clear ALL database data and reload with only accurate Diamond League results
 */
router.post('/', async (req, res) => {
  try {
    console.log('Starting complete database nuke and reload...');
    
    // Step 1: Delete EVERYTHING
    const deletedResults = await Result.deleteMany({});
    const deletedRaces = await Race.deleteMany({});
    const deletedAthletes = await Athlete.deleteMany({});
    
    console.log(`Deleted ${deletedResults.deletedCount} results`);
    console.log(`Deleted ${deletedRaces.deletedCount} races`);
    console.log(`Deleted ${deletedAthletes.deletedCount} athletes`);
    
    // Step 2: Load ONLY the accurate scraper
    const DiamondLeague2025Accurate = require('../scrapers/sites/diamondLeague2025Accurate');
    console.log('Running accurate Diamond League scraper...');
    
    const results = await DiamondLeague2025Accurate.scrape({ topN: 100 });
    console.log(`Accurate scraper returned ${results.length} results`);
    
    // Step 3: Process results
    const summary = await processResults(results, 'diamondLeague2025Accurate', { topN: 100 });
    console.log(`Processed ${summary.processedResults} results successfully`);
    
    res.json({
      success: true,
      message: 'Database completely nuked and reloaded with accurate Diamond League results only',
      summary: {
        deletedResults: deletedResults.deletedCount,
        deletedRaces: deletedRaces.deletedCount,
        deletedAthletes: deletedAthletes.deletedCount,
        totalResults: results.length,
        processedResults: summary.processedResults,
        newAthletes: summary.newAthletes,
        newRaces: summary.newRaces,
        newResults: summary.newResults,
        errors: summary.errors || []
      }
    });
    
  } catch (error) {
    console.error('Error in database nuke and reload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
