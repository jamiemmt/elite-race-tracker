/**
 * API routes for scraper scheduler functionality
 */
const express = require('express');
const router = express.Router();
const scraperScheduler = require('../services/scraperScheduler');

/**
 * @route   POST /api/scraper-scheduler/trigger
 * @desc    Manually trigger a scraper run
 * @access  Public
 */
router.post('/trigger', async (req, res) => {
  try {
    const { scraperId, options, forceRefresh } = req.body;
    
    if (!scraperId) {
      return res.status(400).json({ error: 'Scraper ID is required' });
    }
    
    const results = await scraperScheduler.triggerScraper(
      scraperId, 
      options || {}, 
      forceRefresh || false
    );
    
    res.json({ 
      success: true, 
      message: `Scraper ${scraperId} triggered successfully`,
      results
    });
  } catch (error) {
    console.error('Error triggering scraper:', error);
    res.status(500).json({ 
      error: 'Failed to trigger scraper',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/scraper-scheduler/event
 * @desc    Register an active event for more frequent scraping
 * @access  Public
 */
router.post('/event', (req, res) => {
  try {
    const { eventId, startDate, endDate, scrapers } = req.body;
    
    if (!eventId || !startDate || !endDate || !scrapers) {
      return res.status(400).json({ error: 'Missing required event information' });
    }
    
    scraperScheduler.registerActiveEvent(
      eventId,
      new Date(startDate),
      new Date(endDate),
      scrapers
    );
    
    res.json({ 
      success: true, 
      message: `Event ${eventId} registered successfully` 
    });
  } catch (error) {
    console.error('Error registering event:', error);
    res.status(500).json({ 
      error: 'Failed to register event',
      details: error.message
    });
  }
});

/**
 * @route   POST /api/scraper-scheduler/clear-cache
 * @desc    Clear scraper cache
 * @access  Public
 */
router.post('/clear-cache', (req, res) => {
  try {
    const { scraperId } = req.body;
    
    scraperScheduler.clearCache(scraperId);
    
    res.json({ 
      success: true, 
      message: scraperId 
        ? `Cache cleared for scraper ${scraperId}` 
        : 'All scraper caches cleared' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/scraper-scheduler/status
 * @desc    Get current status of scraper scheduler
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const { scraperId } = req.query;
    
    const status = {
      isHighFrequency: scraperId 
        ? scraperScheduler.shouldRunHighFrequency(scraperId)
        : false,
      currentTime: new Date()
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({ 
      error: 'Failed to get scheduler status',
      details: error.message
    });
  }
});

module.exports = router;
