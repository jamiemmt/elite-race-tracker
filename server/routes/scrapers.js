/**
 * Routes for scraper operations
 */

const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

// @route   GET /api/scrapers
// @desc    List all available scrapers
// @access  Private (admin only)
router.get('/', scraperController.listScrapers);

// @route   POST /api/scrapers/run
// @desc    Run a specific scraper
// @access  Private (admin only)
router.post('/run', scraperController.runScraper);

// @route   POST /api/scrapers/banned-athletes/update
// @desc    Update banned athletes list
// @access  Private (admin only)
router.post('/banned-athletes/update', scraperController.updateBannedAthletes);

module.exports = router;
