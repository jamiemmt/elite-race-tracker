const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Result = require('../models/Result');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

async function clearDiamondLeagueResults() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elite-race-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find all Diamond League races
    const diamondLeagueRaces = await Race.find({
      name: { $regex: /diamond league/i }
    });
    
    console.log(`Found ${diamondLeagueRaces.length} Diamond League races`);
    
    // Get race IDs
    const raceIds = diamondLeagueRaces.map(race => race._id);
    
    // Delete all results for these races
    const deletedResults = await Result.deleteMany({
      race: { $in: raceIds }
    });
    
    console.log(`Deleted ${deletedResults.deletedCount} Diamond League results`);
    
    // Delete the races themselves
    const deletedRaces = await Race.deleteMany({
      _id: { $in: raceIds }
    });
    
    console.log(`Deleted ${deletedRaces.deletedCount} Diamond League races`);
    
    // Optional: Clean up orphaned athletes (athletes with no results)
    const athletesWithResults = await Result.distinct('athlete');
    const orphanedAthletes = await Athlete.find({
      _id: { $nin: athletesWithResults }
    });
    
    if (orphanedAthletes.length > 0) {
      const deletedAthletes = await Athlete.deleteMany({
        _id: { $nin: athletesWithResults }
      });
      console.log(`Deleted ${deletedAthletes.deletedCount} orphaned athletes`);
    }
    
    console.log('Diamond League data cleanup completed successfully');
    
  } catch (error) {
    console.error('Error clearing Diamond League results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
clearDiamondLeagueResults();
