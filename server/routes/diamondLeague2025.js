const express = require('express');
const router = express.Router();
const diamondLeague2025Scheduler = require('../schedulers/diamondLeague2025Scheduler');
const scraperController = require('../controllers/scraperController');

// Get Diamond League 2025 schedule and status
router.get('/schedule', (req, res) => {
  try {
    const status = diamondLeague2025Scheduler.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the Diamond League 2025 scheduler
router.post('/scheduler/start', (req, res) => {
  try {
    diamondLeague2025Scheduler.start();
    res.json({
      success: true,
      message: 'Diamond League 2025 scheduler started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop the Diamond League 2025 scheduler
router.post('/scheduler/stop', (req, res) => {
  try {
    diamondLeague2025Scheduler.stop();
    res.json({
      success: true,
      message: 'Diamond League 2025 scheduler stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run a specific Diamond League meeting scraper
router.post('/meeting/:meetingName/run', async (req, res) => {
  try {
    const { meetingName } = req.params;
    const options = req.body || {};
    
    const result = await diamondLeague2025Scheduler.runMeetingScraper(meetingName, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run all enabled Diamond League 2025 scrapers
router.post('/run-all', async (req, res) => {
  try {
    const options = req.body || {};
    const results = await diamondLeague2025Scheduler.runAllScrapers(options);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get results for a specific Diamond League meeting
router.get('/meeting/:meetingName/results', async (req, res) => {
  try {
    const { meetingName } = req.params;
    const Result = require('../models/Result');
    
    // Find results for the specific meeting
    const results = await Result.find({
      'race.name': { $regex: new RegExp(meetingName, 'i') }
    })
    .populate('athlete')
    .populate('race')
    .sort({ 'race.name': 1, position: 1 });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all Diamond League 2025 results
router.get('/results', async (req, res) => {
  try {
    const Result = require('../models/Result');
    
    const results = await Result.find({
      'race.name': { $regex: /Diamond League 2025/ }
    })
    .populate('athlete')
    .populate('race')
    .sort({ 'race.date': 1, 'race.name': 1, position: 1 });
    
    // Group by meeting
    const groupedResults = {};
    results.forEach(result => {
      const meetingName = result.race.name.split(' - ')[0];
      if (!groupedResults[meetingName]) {
        groupedResults[meetingName] = [];
      }
      groupedResults[meetingName].push(result);
    });
    
    res.json({
      success: true,
      data: groupedResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
