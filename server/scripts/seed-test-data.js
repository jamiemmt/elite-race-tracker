/**
 * Script to seed test data for Elite Race Tracker
 * Creates sample athletes (some banned), races, and results
 */

// Import mongoose and models
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Format seconds into HH:MM:SS or MM:SS format
 * 
 * @param {Number} seconds - Time in seconds
 * @returns {String} - Formatted time string
 */
const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '--:--';
  
  // Convert seconds to hours, minutes, seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Format with leading zeros
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  // Include hours only if present
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elite-race-tracker')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import models
require('../models/Athlete');
require('../models/Race');
require('../models/Result');

const Athlete = mongoose.model('Athlete');
const Race = mongoose.model('Race');
const Result = mongoose.model('Result');

// Sample athletes data
const athletes = [
  {
    name: 'John Smith',
    country: 'USA',
    gender: 'Male',
    dateOfBirth: new Date('1992-05-15'),
    isBanned: false,
    banHistory: [] // Clean athlete
  },
  {
    name: 'Emily Johnson',
    country: 'GBR',
    gender: 'Female',
    dateOfBirth: new Date('1994-09-23'),
    isBanned: false,
    banHistory: [] // Clean athlete
  },
  {
    name: 'Liu Wei',
    country: 'CHN',
    gender: 'Male',
    dateOfBirth: new Date('1990-11-07'),
    isBanned: false,
    banHistory: [] // Clean athlete
  },
  {
    name: 'Maria Garcia',
    country: 'ESP',
    gender: 'Female',
    dateOfBirth: new Date('1996-03-12'),
    isBanned: false,
    banHistory: [] // Clean athlete
  },
  {
    name: 'Alex Banned',
    country: 'RUS',
    gender: 'Male',
    dateOfBirth: new Date('1993-07-21'),
    isBanned: true,
    banHistory: [
      {
        startDate: new Date('2022-06-01'),
        endDate: new Date('2024-06-01'),
        reason: 'Positive test for EPO (AIU Decision #2022-045)'
      }
    ]
  },
  {
    name: 'Sarah Suspended',
    country: 'KEN',
    gender: 'Female',
    dateOfBirth: new Date('1995-12-30'),
    isBanned: true,
    banHistory: [
      {
        startDate: new Date('2021-03-15'),
        endDate: new Date('2023-03-15'),
        reason: 'Positive test for Nandrolone (AIU Decision #2021-012)'
      }
    ]
  }
];

// Sample races data
const races = [
  {
    name: 'Boston Marathon 2023',
    date: new Date('2023-04-17'),
    location: 'Boston, MA, USA',
    distance: 42.195, // kilometers
    distanceUnit: 'km',
    category: 'Road',
    gender: 'Mixed',
    isElite: true
  },
  {
    name: 'World Athletics Championships 2023 - 5000m Men',
    date: new Date('2023-08-20'),
    location: 'Budapest, Hungary',
    distance: 5000, // meters
    distanceUnit: 'm',
    category: 'Track',
    gender: 'Male',
    isElite: true
  },
  {
    name: 'London Marathon 2023',
    date: new Date('2023-04-23'),
    location: 'London, UK',
    distance: 42.195, // kilometers
    distanceUnit: 'km',
    category: 'Road',
    gender: 'Mixed',
    isElite: true
  }
];

// Function to create sample results based on athletes and races
const generateResults = (athletesData, racesData) => {
  const results = [];
  
  // Boston Marathon results
  const bostonTimes = [7920, 8040, 8100, 8160, 8220, 8280]; // ~2:12 to ~2:18
  athletesData.forEach((athlete, index) => {
    if (index < 6) { // Only first 6 athletes in Boston
      const finishTime = bostonTimes[index];
      results.push({
        athlete: athlete._id,
        race: racesData[0]._id,
        finishTime: finishTime,
        formattedTime: formatTime(finishTime),
        position: index + 1
      });
    }
  });
  
  // 5000m track results
  const trackTimes = [790, 792, 794, 796, 798, 800]; // ~13:10 to ~13:20
  athletesData.forEach((athlete, index) => {
    if (index < 6) { // All athletes in 5000m
      const finishTime = trackTimes[index];
      results.push({
        athlete: athlete._id,
        race: racesData[1]._id,
        finishTime: finishTime,
        formattedTime: formatTime(finishTime),
        position: index + 1
      });
    }
  });
  
  // London Marathon results
  const londonTimes = [7800, 7860, 7920, 7980, 8040]; // ~2:10 to ~2:14
  athletesData.forEach((athlete, index) => {
    if (index % 2 === 0 && index < 5) { // Only even index athletes in London
      const finishTime = londonTimes[index/2];
      results.push({
        athlete: athlete._id,
        race: racesData[2]._id,
        finishTime: finishTime,
        formattedTime: formatTime(finishTime),
        position: (index/2) + 1
      });
    }
  });
  
  return results;
};

// Main function to seed data
const seedData = async () => {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await Athlete.deleteMany({});
    await Race.deleteMany({});
    await Result.deleteMany({});
    
    // Insert athletes
    console.log('Creating athletes...');
    const createdAthletes = await Athlete.insertMany(athletes);
    console.log(`Created ${createdAthletes.length} athletes`);
    
    // Insert races
    console.log('Creating races...');
    const createdRaces = await Race.insertMany(races);
    console.log(`Created ${createdRaces.length} races`);
    
    // Generate and insert results
    console.log('Generating results...');
    const resultsData = generateResults(createdAthletes, createdRaces);
    const createdResults = await Result.insertMany(resultsData);
    console.log(`Created ${createdResults.length} results`);
    
    console.log('Data seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Execute the seeding
seedData();
