const express = require('express');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Banned athletes API is working', timestamp: new Date().toISOString() });
});

// Get list of banned athletes (known list only for now)
router.get('/list', (req, res) => {
  try {
    // Import service only when needed to avoid initialization issues
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    // Return just the known banned athletes list for immediate response
    const knownBanned = bannedAthleteService.getKnownBannedAthletes();
    res.json({
      count: knownBanned.length,
      athletes: knownBanned
    });
  } catch (error) {
    console.error('Error fetching banned athletes:', error);
    res.status(500).json({ error: 'Failed to fetch banned athletes', details: error.message });
  }
});

// Update athlete ban status in database (use known list only for now)
router.post('/update', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    const result = await bannedAthleteService.updateAthleteBanStatusFromKnownList();
    res.json({
      message: 'Athlete ban status updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error updating athlete ban status:', error);
    res.status(500).json({ error: 'Failed to update athlete ban status' });
  }
});

// Check if a specific athlete is banned
router.get('/check/:name/:country', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    const { name, country } = req.params;
    const isBanned = await bannedAthleteService.isAthleteBanned(name, country);
    res.json({ name, country, isBanned });
  } catch (error) {
    console.error('Error checking athlete ban status:', error);
    res.status(500).json({ error: 'Failed to check athlete ban status' });
  }
});

// Get ban statistics by agency/source
router.get('/stats', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    const stats = await bannedAthleteService.getBanStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching ban statistics:', error);
    res.status(500).json({ error: 'Failed to fetch ban statistics' });
  }
});

// Get banned athletes from database with source information
router.get('/database', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    const bannedAthletes = await bannedAthleteService.getBannedAthletesFromDatabase();
    res.json(bannedAthletes);
  } catch (error) {
    console.error('Error fetching banned athletes from database:', error);
    res.status(500).json({ error: 'Failed to fetch banned athletes from database' });
  }
});

// Clean up invalid AIU entries (dates as names, etc.)
router.post('/cleanup-invalid', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    const result = await bannedAthleteService.cleanupInvalidAiuEntries();
    res.json({
      success: true,
      message: 'Invalid AIU entries cleaned up successfully',
      summary: result
    });
  } catch (error) {
    console.error('Error cleaning up invalid AIU entries:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to clean up invalid AIU entries',
      details: error.message 
    });
  }
});

// Populate database with all current AIU banned athletes from live sources
router.post('/populate-aiu', async (req, res) => {
  try {
    const BannedAthleteService = require('../services/bannedAthleteService');
    const bannedAthleteService = new BannedAthleteService();
    
    const result = await bannedAthleteService.populateAllCurrentAiuAthletes();
    res.json({
      success: true,
      message: 'AIU banned athletes populated successfully',
      summary: result
    });
  } catch (error) {
    console.error('Error populating AIU banned athletes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to populate AIU banned athletes',
      details: error.message 
    });
  }
});

module.exports = router;
