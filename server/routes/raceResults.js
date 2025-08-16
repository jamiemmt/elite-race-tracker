/**
 * Routes for race results with banned athlete filtering
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bannedAthleteProcessor = require('../utils/bannedAthleteProcessor');

// Get race models
const Race = mongoose.model('Race');
const Result = mongoose.model('Result');
const Athlete = mongoose.model('Athlete');

/**
 * Get all race results (standard view)
 * Includes all athletes without any special processing
 */
router.get('/races/:raceId/results', async (req, res) => {
  try {
    const { raceId } = req.params;
    
    // Validate race ID
    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    
    // Find race
    const race = await Race.findById(raceId);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    // Find all results for the race with athlete information
    const results = await Result.find({ race: raceId })
      .populate('athlete')
      .sort({ time: 1 }); // Sort by time ascending
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching race results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get "clean" race results (View 1)
 * Removes any athlete who has ever served a ban
 */
router.get('/races/:raceId/results/clean', async (req, res) => {
  try {
    const { raceId } = req.params;
    
    // Validate race ID
    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    
    // Find race
    const race = await Race.findById(raceId);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    // Find all results for the race with athlete information
    const results = await Result.find({ race: raceId })
      .populate('athlete')
      .sort({ time: 1 }); // Sort by time ascending
    
    // Process results to remove banned athletes
    const cleanResults = await bannedAthleteProcessor.getCleanResults(results);
    
    res.json(cleanResults);
  } catch (error) {
    console.error('Error fetching clean race results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get "marked" race results (View 2)
 * Includes all athletes but marks banned ones and corrects placements
 */
router.get('/races/:raceId/results/marked', async (req, res) => {
  try {
    const { raceId } = req.params;
    
    // Validate race ID
    if (!mongoose.Types.ObjectId.isValid(raceId)) {
      return res.status(400).json({ error: 'Invalid race ID' });
    }
    
    // Find race
    const race = await Race.findById(raceId);
    if (!race) {
      return res.status(404).json({ error: 'Race not found' });
    }
    
    // Find all results for the race with athlete information
    const results = await Result.find({ race: raceId })
      .populate('athlete')
      .sort({ time: 1 }); // Sort by time ascending
    
    // Process results to mark banned athletes
    const markedResults = await bannedAthleteProcessor.getMarkedResults(results);
    
    res.json(markedResults);
  } catch (error) {
    console.error('Error fetching marked race results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Get banned athlete details
 */
router.get('/athletes/:athleteId/bans', async (req, res) => {
  try {
    const { athleteId } = req.params;
    
    // Validate athlete ID
    if (!mongoose.Types.ObjectId.isValid(athleteId)) {
      return res.status(400).json({ error: 'Invalid athlete ID' });
    }
    
    // Find athlete
    const athlete = await Athlete.findById(athleteId);
    if (!athlete) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    
    // Get ban details
    const banDetails = await bannedAthleteProcessor.getAthleteBanDetails(athlete);
    
    res.json({
      athlete: {
        _id: athlete._id,
        name: athlete.name,
        country: athlete.country,
        gender: athlete.gender
      },
      bans: banDetails
    });
  } catch (error) {
    console.error('Error fetching athlete ban details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
