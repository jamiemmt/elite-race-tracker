const express = require('express');
const router = express.Router();
const Athlete = require('../models/Athlete');

// Get all athletes
router.get('/', async (req, res) => {
  try {
    const athletes = await Athlete.find().sort({ name: 1 });
    res.json(athletes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get athlete by ID
router.get('/:id', async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    res.json(athlete);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Create athlete
router.post('/', async (req, res) => {
  try {
    const newAthlete = new Athlete(req.body);
    const athlete = await newAthlete.save();
    res.json(athlete);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update athlete
router.put('/:id', async (req, res) => {
  try {
    const athlete = await Athlete.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    res.json(athlete);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete athlete
router.delete('/:id', async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    await athlete.remove();
    res.json({ msg: 'Athlete removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Toggle ban status
router.patch('/:id/toggle-ban', async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    
    athlete.isBanned = !athlete.isBanned;
    
    // If banning an athlete, add to ban history
    if (athlete.isBanned && req.body.reason) {
      athlete.banHistory.push({
        startDate: new Date(),
        reason: req.body.reason
      });
    }
    
    await athlete.save();
    res.json(athlete);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add ban record
router.post('/:id/ban', async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    
    if (!startDate || !reason) {
      return res.status(400).json({ msg: 'Start date and reason are required' });
    }
    
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    
    athlete.banHistory.push({
      startDate,
      endDate,
      reason
    });
    
    // Set current ban status to true
    athlete.isBanned = true;
    
    await athlete.save();
    res.json(athlete);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
