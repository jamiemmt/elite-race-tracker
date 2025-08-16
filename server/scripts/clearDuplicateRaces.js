const mongoose = require('mongoose');
const Race = require('../models/Race');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const clearRaces = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    const raceNameToDelete = 'Boston Marathon 2025';
    const deleteResult = await Race.deleteMany({ name: raceNameToDelete });

    console.log(`Deleted ${deleteResult.deletedCount} races named "${raceNameToDelete}".`);

  } catch (error) {
    console.error('Error clearing races:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

clearRaces();
