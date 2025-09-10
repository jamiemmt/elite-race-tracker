const express = require('express');
const router = express.Router();
const diamondLeagueScheduler = require('../schedulers/diamondLeagueScheduler');

/**
 * Scheduler management routes
 */

// Get scheduler status
router.get('/status', (req, res) => {
  try {
    const status = diamondLeagueScheduler.getStatus();
    res.json({
      success: true,
      scheduler: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start scheduler
router.post('/start', (req, res) => {
  try {
    diamondLeagueScheduler.start();
    res.json({
      success: true,
      message: 'Diamond League scheduler started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop scheduler
router.post('/stop', (req, res) => {
  try {
    diamondLeagueScheduler.stop();
    res.json({
      success: true,
      message: 'Diamond League scheduler stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger manual update
router.post('/trigger', async (req, res) => {
  try {
    await diamondLeagueScheduler.triggerUpdate();
    res.json({
      success: true,
      message: 'Manual update triggered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
