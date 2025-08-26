const express = require('express');
const router = express.Router();
const BannedAthleteService = require('../services/bannedAthleteService');

const bannedAthleteService = new BannedAthleteService();

// Get list of banned athletes (known list only for now)
router.get('/list', async (req, res) => {
  try {
    // Return just the known banned athletes list for immediate response
    const knownBanned = bannedAthleteService.getKnownBannedAthletes();
    res.json(knownBanned);
  } catch (error) {
    console.error('Error fetching banned athletes:', error);
    res.status(500).json({ error: 'Failed to fetch banned athletes' });
  }
});

// Update athlete ban status in database (use known list only for now)
router.post('/update', async (req, res) => {
  try {
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
    const bannedAthletes = await bannedAthleteService.getBannedAthletesFromDatabase();
    res.json(bannedAthletes);
  } catch (error) {
    console.error('Error fetching banned athletes from database:', error);
    res.status(500).json({ error: 'Failed to fetch banned athletes from database' });
  }
});

module.exports = router;
