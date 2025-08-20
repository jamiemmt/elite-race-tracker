const express = require('express');
const router = express.Router();
const Race = require('../models/Race');

// Get all races
router.get('/', async (req, res) => {
  try {
    const currentDate = new Date();
    const races = await Race.find({ date: { $lte: currentDate } }).sort({ date: -1 });
    res.json(races);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get race by ID
router.get('/:id', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    if (!race) {
      return res.status(404).json({ msg: 'Race not found' });
    }
    res.json(race);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Race not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Create race
router.post('/', async (req, res) => {
  try {
    const newRace = new Race(req.body);
    const race = await newRace.save();
    res.json(race);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update race
router.put('/:id', async (req, res) => {
  try {
    const race = await Race.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!race) {
      return res.status(404).json({ msg: 'Race not found' });
    }
    res.json(race);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete race
router.delete('/:id', async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    if (!race) {
      return res.status(404).json({ msg: 'Race not found' });
    }
    await race.remove();
    res.json({ msg: 'Race removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get races by category
router.get('/category/:category', async (req, res) => {
  try {
    const races = await Race.find({ category: req.params.category }).sort({ date: -1 });
    res.json(races);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get races by distance
router.get('/distance/:distance/:unit', async (req, res) => {
  try {
    const races = await Race.find({ 
      distance: req.params.distance,
      distanceUnit: req.params.unit 
    }).sort({ date: -1 });
    res.json(races);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
