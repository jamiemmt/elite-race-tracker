const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Result = require('./server/models/Result');
const Race = require('./server/models/Race');
const Athlete = require('./server/models/Athlete');

async function clearAllData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elite-race-tracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Delete all results
    const deletedResults = await Result.deleteMany({});
    console.log(`Deleted ${deletedResults.deletedCount} results`);
    
    // Delete all races
    const deletedRaces = await Race.deleteMany({});
    console.log(`Deleted ${deletedRaces.deletedCount} races`);
    
    // Delete all athletes
    const deletedAthletes = await Athlete.deleteMany({});
    console.log(`Deleted ${deletedAthletes.deletedCount} athletes`);
    
    console.log('Database cleared completely');
    
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
clearAllData();
