const mongoose = require('mongoose');
const Race = require('../models/Race');
const Result = require('../models/Result');
const Athlete = require('../models/Athlete');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const verifyResults = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    console.log('--- 5 Most Recently Created Races ---');
    const recentRaces = await Race.find().sort({ createdAt: -1 }).limit(5);
    if (recentRaces.length === 0) {
      console.log('No races found in the database.');
    } else {
      recentRaces.forEach(race => {
        console.log(`- ${race.name} (ID: ${race._id}, Created: ${race.createdAt})`);
      });
    }
    console.log('------------------------------------');

    console.log('\n--- 10 Most Recently Created Results ---');
    const recentResults = await Result.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('athlete race');

    if (recentResults.length === 0) {
      console.log('No results found in the database.');
    } else {
      recentResults.forEach(result => {
        const athleteName = result.athlete ? result.athlete.name : 'N/A';
        const raceName = result.race ? result.race.name : 'N/A';
        console.log(
          `- Athlete: ${athleteName}, ` +
          `Race: ${raceName}, ` +
          `Time: ${result.formattedTime}, ` +
          `Created: ${result.createdAt}`
        );
      });
    }
    console.log('----------------------------------------');

    // Clean up the created races for the next run
    const deleteResult = await Race.deleteMany({ name: 'Boston Marathon 2025' });
    console.log(`\nCleaned up ${deleteResult.deletedCount} test race(s).`);

  } catch (error) {
    console.error('Error verifying results:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
};

verifyResults();
