const mongoose = require('mongoose');
const Race = require('../models/Race');
const Result = require('../models/Result');
const Athlete = require('../models/Athlete');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jamiemmtcs:y6NfC2uckVdr7EhJ@racedb.cyekzck.mongodb.net/racedb?retryWrites=true&w=majority&appName=racedb';

async function debugResults() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find 2025 races
    const races2025 = await Race.find({ 
      $or: [
        { name: { $regex: '2025', $options: 'i' } },
        { date: { $gte: new Date('2025-01-01'), $lt: new Date('2026-01-01') } }
      ]
    }).lean();

    console.log(`\nFound ${races2025.length} 2025 races:`);
    for (const race of races2025) {
      console.log(`- ${race.name} (${race._id})`);
      console.log(`  Date: ${race.date}`);
      console.log(`  Embedded results: ${race.results ? race.results.length : 0}`);
      
      // Check for separate Result documents
      const separateResults = await Result.find({ race: race._id }).countDocuments();
      console.log(`  Separate Result docs: ${separateResults}`);
      console.log('');
    }

    // Check Boston 2025 Men's results specifically
    const bostonMenId = '68a642919a7b1a3fd86695e6';
    const bostonMenRace = await Race.findById(bostonMenId).lean();
    console.log(`\nBoston 2025 Men's Race Details:`);
    console.log(`- Name: ${bostonMenRace?.name}`);
    console.log(`- Results array length: ${bostonMenRace?.results?.length || 0}`);
    if (bostonMenRace?.results?.length > 0) {
      console.log(`- First result: ${JSON.stringify(bostonMenRace.results[0], null, 2)}`);
    }

    const bostonResults = await Result.find({ race: bostonMenId }).populate('athlete');
    console.log(`- Separate Result documents: ${bostonResults.length}`);
    if (bostonResults.length > 0) {
      console.log(`- First separate result: ${JSON.stringify(bostonResults[0], null, 2)}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugResults();
