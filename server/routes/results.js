const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Athlete = require('../models/Athlete');
const Race = require('../models/Race');

// Get all results
router.get('/', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit')
      .sort({ finishTime: 1 });
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get result by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit');
    
    if (!result) {
      return res.status(404).json({ msg: 'Result not found' });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Result not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Create result
router.post('/', async (req, res) => {
  try {
    // Check if athlete exists
    const athlete = await Athlete.findById(req.body.athlete);
    if (!athlete) {
      return res.status(404).json({ msg: 'Athlete not found' });
    }
    
    // Check if race exists
    const race = await Race.findById(req.body.race);
    if (!race) {
      return res.status(404).json({ msg: 'Race not found' });
    }
    
    const newResult = new Result(req.body);
    const result = await newResult.save();
    
    // Populate the response
    const populatedResult = await Result.findById(result._id)
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit');
    
    res.json(populatedResult);
  } catch (err) {
    console.error(err.message);
    // Check for duplicate entry
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'This athlete already has a result for this race' });
    }
    res.status(500).send('Server Error');
  }
});

// Update result
router.put('/:id', async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('athlete', 'name country isBanned')
    .populate('race', 'name date location distance distanceUnit');
    
    if (!result) {
      return res.status(404).json({ msg: 'Result not found' });
    }
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete result
router.delete('/:id', async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) {
      return res.status(404).json({ msg: 'Result not found' });
    }
    
    await result.remove();
    res.json({ msg: 'Result removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get results by race ID
router.get('/race/:raceId', async (req, res) => {
  try {
    let results = await Result.find({ race: req.params.raceId })
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit')
      .sort({ finishTime: 1 });

    // If no Result documents exist, fall back to embedded results in Race
    if (results.length === 0) {
      const race = await Race.findById(req.params.raceId).lean();
      if (race && Array.isArray(race.results) && race.results.length > 0) {
        // Check if these are placeholder/fabricated results 
        // Note: 2025 Tokyo, Boston, and London marathons have real verified results
        const raceYear = new Date(race.date).getFullYear();
        const raceName = race.name.toLowerCase();
        const hasRealResults = (raceYear === 2025 && (
          raceName.includes('tokyo') || 
          raceName.includes('boston') || 
          raceName.includes('london')
        ));
        const isPlaceholderData = raceYear > 2025 || (raceYear >= 2025 && !hasRealResults);
        
        if (isPlaceholderData) {
          // Return empty results for placeholder data
          results = [];
        } else {
          // Attach dummy athlete/race info for compatibility (real scraped data)
          results = race.results.map((result, idx) => ({
            ...result,
            athlete: result.athlete || { name: result.athleteName || 'Unknown', country: result.athleteCountry || 'Unknown', isBanned: false },
            race: { _id: race._id, name: race.name, date: race.date, location: race.location, distance: race.distance, distanceUnit: race.distanceUnit },
            formattedTime: result.formattedTime || '',
            position: result.position || idx + 1,
            _id: result._id || `embedded-${idx}`
          }));
        }
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get results by athlete ID
router.get('/athlete/:athleteId', async (req, res) => {
  try {
    const results = await Result.find({ athlete: req.params.athleteId })
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit')
      .sort({ finishTime: 1 });
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get fastest times for a specific race event
router.get('/fastest/:distance/:unit', async (req, res) => {
  try {
    const { year } = req.query;
    
    // Build race query
    const raceQuery = { 
      distance: req.params.distance,
      distanceUnit: req.params.unit
    };
    
    // Add year filter if provided
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      raceQuery.date = { $gte: startDate, $lte: endDate };
    }
    
    // Find races with the specified distance and unit
    const races = await Race.find(raceQuery);
    
    const raceIds = races.map(race => race._id);
    
    // Get results for these races
    const results = await Result.find({ race: { $in: raceIds } })
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit')
      .sort({ finishTime: 1 })
      .limit(100);
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get fastest times for a specific race event excluding banned athletes
router.get('/fastest-clean/:distance/:unit', async (req, res) => {
  try {
    const { year } = req.query;
    
    // Build race query
    const raceQuery = { 
      distance: req.params.distance,
      distanceUnit: req.params.unit
    };
    
    // Add year filter if provided
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      raceQuery.date = { $gte: startDate, $lte: endDate };
    }
    
    // Find races with the specified distance and unit
    const races = await Race.find(raceQuery);
    
    const raceIds = races.map(race => race._id);
    
    // Get non-banned athletes
    const cleanAthletes = await Athlete.find({ isBanned: false });
    const cleanAthleteIds = cleanAthletes.map(athlete => athlete._id);
    
    // Get results for these races and clean athletes
    const results = await Result.find({ 
      race: { $in: raceIds },
      athlete: { $in: cleanAthleteIds }
    })
      .populate('athlete', 'name country isBanned')
      .populate('race', 'name date location distance distanceUnit')
      .sort({ finishTime: 1 })
      .limit(100);
    
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
