const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');
const { processResults } = require('../controllers/scraperController');

/**
 * POST /api/clean-results/diamond-league
 * Clear all data and run only the clean Diamond League scraper
 */
router.post('/diamond-league', async (req, res) => {
  try {
    console.log('Starting clean Diamond League results process...');
    
    // Step 1: Clear all existing data
    console.log('Clearing all existing data...');
    await Result.deleteMany({});
    await Race.deleteMany({});
    await Athlete.deleteMany({});
    console.log('Database cleared');
    
    // Step 2: Load and run only the clean scraper
    const DiamondLeague2025Clean = require('../scrapers/sites/diamondLeague2025Clean');
    console.log('Running clean scraper...');
    
    const results = await DiamondLeague2025Clean.scrape({ topN: 50 });
    console.log(`Clean scraper returned ${results.length} results`);
    
    // Step 3: Process results with validation
    const summary = await processResults(results, 'diamondLeague2025Clean', { topN: 50 });
    console.log('Results processed successfully');
    
    res.json({
      success: true,
      message: 'Clean Diamond League results loaded successfully',
      summary: {
        clearedData: true,
        totalResults: results.length,
        processedResults: summary.processedResults,
        newAthletes: summary.newAthletes,
        newRaces: summary.newRaces,
        newResults: summary.newResults,
        errors: summary.errors || []
      }
    });
    
  } catch (error) {
    console.error('Error in clean results process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/clean-results/verify
 * Verify that all results are clean (no parsing artifacts)
 */
router.get('/verify', async (req, res) => {
  try {
    const results = await Result.find({})
      .populate('athlete')
      .populate('race')
      .limit(100);
    
    const issues = [];
    
    for (const result of results) {
      const athleteName = result.athlete?.name || '';
      const formattedTime = result.formattedTime || '';
      
      // Check for parsing artifacts
      if (/\d+p\s+ET/i.test(athleteName)) {
        issues.push({ type: 'athlete_name', value: athleteName, id: result._id });
      }
      if (/finished$/i.test(athleteName)) {
        issues.push({ type: 'athlete_name', value: athleteName, id: result._id });
      }
      if (/WHAT$/i.test(athleteName)) {
        issues.push({ type: 'athlete_name', value: athleteName, id: result._id });
      }
      if (/^\d+\s*/.test(athleteName)) {
        issues.push({ type: 'athlete_name', value: athleteName, id: result._id });
      }
      if (/\.\d+:\d+$/.test(formattedTime)) {
        issues.push({ type: 'time', value: formattedTime, id: result._id });
      }
      if (/\d+:\d+$/.test(formattedTime) && !formattedTime.includes('.')) {
        issues.push({ type: 'time', value: formattedTime, id: result._id });
      }
    }
    
    res.json({
      success: true,
      totalResults: results.length,
      cleanResults: results.length - issues.length,
      issues: issues.length,
      issueDetails: issues.slice(0, 10), // First 10 issues
      isClean: issues.length === 0
    });
    
  } catch (error) {
    console.error('Error verifying results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
