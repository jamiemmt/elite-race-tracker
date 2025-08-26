const express = require('express');
const router = express.Router();
const BannedAthleteService = require('../services/bannedAthleteService');

const bannedAthleteService = new BannedAthleteService();

// Get all banned athletes from various sources
router.get('/list', async (req, res) => {
  try {
    const bannedAthletes = await bannedAthleteService.getAllBannedAthletes();
    res.json(bannedAthletes);
  } catch (err) {
    console.error('Error fetching banned athletes:', err);
    res.status(500).json({ error: 'Failed to fetch banned athletes list' });
  }
});

// Update athlete ban status in database
router.post('/update', async (req, res) => {
  try {
    const result = await bannedAthleteService.updateAthleteBanStatus();
    res.json({
      message: 'Athlete ban status updated successfully',
      ...result
    });
  } catch (err) {
    console.error('Error updating athlete ban status:', err);
    res.status(500).json({ error: 'Failed to update athlete ban status' });
  }
});

// Check if a specific athlete is banned
router.get('/check/:name/:country', async (req, res) => {
  try {
    const { name, country } = req.params;
    const isBanned = await bannedAthleteService.isAthleteBanned(name, country);
    res.json({ name, country, isBanned });
  } catch (err) {
    console.error('Error checking athlete ban status:', err);
    res.status(500).json({ error: 'Failed to check athlete ban status' });
  }
});

module.exports = router;
