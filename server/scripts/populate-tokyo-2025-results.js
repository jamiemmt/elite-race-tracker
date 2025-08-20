/**
 * Script to populate MongoDB with real 2025 Tokyo Marathon results
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Race model schema
const RaceSchema = new mongoose.Schema({
  name: String,
  date: Date,
  distance: Number,
  distanceUnit: String,
  location: String,
  category: String,
  gender: String,
  isElite: Boolean,
  results: [{
    athlete: {
      name: String,
      country: String,
      gender: String
    },
    time: Number,
    position: Number,
    formattedTime: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

function convertTimeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
}

function createRaceData(marathonName, location, date, gender, results) {
  return {
    name: `${marathonName} 2025 - ${gender === 'Male' ? "Men's" : "Women's"} Division`,
    date: new Date(date),
    distance: 42195,
    distanceUnit: 'm',
    location: location,
    category: 'Road',
    gender: gender,
    isElite: true,
    results: results.map(result => ({
      athlete: {
        name: result.name,
        country: result.country,
        gender: gender
      },
      time: convertTimeToSeconds(result.time),
      position: result.position,
      formattedTime: result.time
    })),
    lastUpdated: new Date()
  };
}

// Real 2025 Tokyo Marathon Results - March 2, 2025
const tokyo2025Results = {
  men: [
    { name: 'Tadese Takele', country: 'ETH', time: '2:03:23', position: 1 },
    { name: 'Deresa Geleta', country: 'ETH', time: '2:03:51', position: 2 },
    { name: 'Vincent Kipkemoi', country: 'KEN', time: '2:04:00', position: 3 },
    { name: 'Titus Kipruto', country: 'KEN', time: '2:05:34', position: 4 },
    { name: 'Asefa Uma', country: 'ETH', time: '2:05:46', position: 5 },
    { name: 'Benson Kipruto', country: 'KEN', time: '2:05:46', position: 6 },
    { name: 'Geoffrey Toroitich', country: 'KEN', time: '2:05:46', position: 7 },
    { name: 'Suldan Hassan', country: 'SWE', time: '2:05:57', position: 8 },
    { name: 'Joshua Cheptegei', country: 'UGA', time: '2:05:59', position: 9 },
    { name: 'Tsubasa Ichiyama', country: 'JPN', time: '2:06:00', position: 10 }
  ],
  women: [
    { name: 'Sutume Asefa Kebede', country: 'ETH', time: '2:16:31', position: 1 },
    { name: 'Winfridah Moraa Moseti', country: 'KEN', time: '2:16:56', position: 2 },
    { name: 'Hawi Feysa', country: 'ETH', time: '2:17:00', position: 3 },
    { name: 'Magdalyne Masai', country: 'KEN', time: '2:19:28', position: 4 },
    { name: 'Rosemary Wanjiru', country: 'KEN', time: '2:19:57', position: 5 },
    { name: 'Desi Mokonin', country: 'BRN', time: '2:20:07', position: 6 },
    { name: 'Gotytom Gebreslase', country: 'ETH', time: '2:20:25', position: 7 },
    { name: 'Degitu Azimeraw', country: 'ETH', time: '2:20:26', position: 8 },
    { name: 'Zhang Deshun', country: 'CHN', time: '2:20:53', position: 9 },
    { name: 'Jessica Stenson', country: 'AUS', time: '2:22:56', position: 10 }
  ]
};

async function populateTokyo2025Results() {
  console.log('Starting Tokyo Marathon 2025 results population...');
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set. Exiting.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Race = mongoose.model('Race', RaceSchema);
    
    const racesToCreate = [
      // Tokyo Marathon 2025
      createRaceData('Tokyo Marathon', 'Tokyo, Japan', '2025-03-02', 'Male', tokyo2025Results.men),
      createRaceData('Tokyo Marathon', 'Tokyo, Japan', '2025-03-02', 'Female', tokyo2025Results.women)
    ];
    
    for (const raceData of racesToCreate) {
      try {
        // Check if race already exists
        const existingRace = await Race.findOne({
          name: raceData.name,
          date: raceData.date
        });
        
        if (existingRace) {
          // Update existing race
          existingRace.results = raceData.results;
          existingRace.lastUpdated = new Date();
          await existingRace.save();
          console.log(`✅ Updated: ${raceData.name}`);
        } else {
          // Create new race
          const newRace = new Race(raceData);
          await newRace.save();
          console.log(`✅ Created: ${raceData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error saving ${raceData.name}:`, error);
      }
    }
    
    console.log('✅ Tokyo Marathon 2025 results population completed!');
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
populateTokyo2025Results().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
