/**
 * Elite Race Tracker - Test Data Script
 * 
 * This script populates the database with test data for the Elite Race Tracker application.
 * It creates sample athletes, races, and results to demonstrate the application's functionality.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Athlete = require('./server/models/Athlete');
const Race = require('./server/models/Race');
const Result = require('./server/models/Result');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  process.exit(1);
});

// Sample data
const athletes = [
  {
    name: 'Eliud Kipchoge',
    country: 'Kenya',
    gender: 'Male',
    dateOfBirth: '1984-11-05',
    isBanned: false,
    banHistory: []
  },
  {
    name: 'Brigid Kosgei',
    country: 'Kenya',
    gender: 'Female',
    dateOfBirth: '1994-02-20',
    isBanned: false,
    banHistory: []
  },
  {
    name: 'Jakob Ingebrigtsen',
    country: 'Norway',
    gender: 'Male',
    dateOfBirth: '2000-09-19',
    isBanned: false,
    banHistory: []
  },
  {
    name: 'Sifan Hassan',
    country: 'Netherlands',
    gender: 'Female',
    dateOfBirth: '1993-01-01',
    isBanned: false,
    banHistory: []
  },
  {
    name: 'Justin Gatlin',
    country: 'United States of America',
    gender: 'Male',
    dateOfBirth: '1982-02-10',
    isBanned: true,
    banHistory: [
      {
        startDate: '2006-08-15',
        endDate: '2010-08-15',
        reason: 'Doping violation - Testosterone',
        authority: 'IAAF',
        notes: 'Four-year ban reduced from eight years'
      },
      {
        startDate: '2001-05-01',
        endDate: '2002-05-01',
        reason: 'Doping violation - Amphetamines',
        authority: 'USADA',
        notes: 'Reduced to one year due to medication for ADD'
      }
    ]
  },
  {
    name: 'Maria Sharapova',
    country: 'Russia',
    gender: 'Female',
    dateOfBirth: '1987-04-19',
    isBanned: true,
    banHistory: [
      {
        startDate: '2016-03-12',
        endDate: '2017-04-25',
        reason: 'Doping violation - Meldonium',
        authority: 'ITF',
        notes: 'Initially two years, reduced to 15 months on appeal'
      }
    ]
  }
];

const races = [
  {
    name: 'London Marathon 2023',
    location: 'London, UK',
    date: '2023-04-23',
    distance: 42.2,
    distanceUnit: 'km',
    category: 'Road',
    gender: 'Male',
    isElite: true
  },
  {
    name: 'London Marathon 2023',
    location: 'London, UK',
    date: '2023-04-23',
    distance: 42.2,
    distanceUnit: 'km',
    category: 'Road',
    gender: 'Female',
    isElite: true
  },
  {
    name: 'World Championships 1500m',
    location: 'Budapest, Hungary',
    date: '2023-08-22',
    distance: 1500,
    distanceUnit: 'm',
    category: 'Track',
    gender: 'Male',
    isElite: true
  },
  {
    name: 'World Championships 1500m',
    location: 'Budapest, Hungary',
    date: '2023-08-22',
    distance: 1500,
    distanceUnit: 'm',
    category: 'Track',
    gender: 'Female',
    isElite: true
  },
  {
    name: 'Olympic 100m Final',
    location: 'Tokyo, Japan',
    date: '2021-08-01',
    distance: 100,
    distanceUnit: 'm',
    category: 'Track',
    gender: 'Male',
    isElite: true
  },
  {
    name: 'New York City Marathon 2022',
    location: 'New York, USA',
    date: '2022-11-06',
    distance: 42.2,
    distanceUnit: 'km',
    category: 'Road',
    gender: 'Male',
    isElite: true
  }
];

// Function to populate test data
const populateTestData = async () => {
  try {
    // Clear existing data
    await Athlete.deleteMany({});
    await Race.deleteMany({});
    await Result.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Insert athletes
    const createdAthletes = await Athlete.insertMany(athletes);
    console.log(`Inserted ${createdAthletes.length} athletes`);
    
    // Insert races
    const createdRaces = await Race.insertMany(races);
    console.log(`Inserted ${createdRaces.length} races`);
    
    // Create results
    const results = [
      {
        athlete: createdAthletes[0]._id, // Eliud Kipchoge
        race: createdRaces[0]._id, // London Marathon 2023 (Male)
        finishTime: 7623, // 2:07:03
        formattedTime: '2:07:03',
        position: 1
      },
      {
        athlete: createdAthletes[1]._id, // Brigid Kosgei
        race: createdRaces[1]._id, // London Marathon 2023 (Female)
        finishTime: 8103, // 2:15:03
        formattedTime: '2:15:03',
        position: 1
      },
      {
        athlete: createdAthletes[2]._id, // Jakob Ingebrigtsen
        race: createdRaces[2]._id, // World Championships 1500m (Male)
        finishTime: 212.5, // 3:32.50
        formattedTime: '3:32.50',
        position: 1
      },
      {
        athlete: createdAthletes[3]._id, // Sifan Hassan
        race: createdRaces[3]._id, // World Championships 1500m (Female)
        finishTime: 232.8, // 3:52.80
        formattedTime: '3:52.80',
        position: 1
      },
      {
        athlete: createdAthletes[4]._id, // Justin Gatlin (banned)
        race: createdRaces[4]._id, // Olympic 100m Final
        finishTime: 9.89,
        formattedTime: '9.89',
        position: 2
      },
      {
        athlete: createdAthletes[0]._id, // Eliud Kipchoge
        race: createdRaces[5]._id, // New York City Marathon 2022
        finishTime: 7743, // 2:09:03
        formattedTime: '2:09:03',
        position: 1
      }
    ];
    
    const createdResults = await Result.insertMany(results);
    console.log(`Inserted ${createdResults.length} results`);
    
    console.log('Test data population complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error populating test data:', err);
    process.exit(1);
  }
};

// Run the function
populateTestData();
