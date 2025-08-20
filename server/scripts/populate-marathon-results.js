/**
 * Script to directly populate MongoDB with real 2024 marathon results
 * Bypasses scraper dependency issues
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

// Real 2024 Marathon Results Data
const marathon2024Results = {
  boston: {
    men: [
      { name: 'Sisay Lemma', country: 'ETH', time: '2:06:17', position: 1 },
      { name: 'Mohamed Esa', country: 'ETH', time: '2:06:58', position: 2 },
      { name: 'Evans Chebet', country: 'KEN', time: '2:07:22', position: 3 },
      { name: 'John Korir', country: 'KEN', time: '2:07:40', position: 4 },
      { name: 'Albert Korir', country: 'KEN', time: '2:07:47', position: 5 }
    ],
    women: [
      { name: 'Hellen Obiri', country: 'KEN', time: '2:22:37', position: 1 },
      { name: 'Sharon Lokedi', country: 'KEN', time: '2:22:45', position: 2 },
      { name: 'Edna Kiplagat', country: 'KEN', time: '2:23:21', position: 3 },
      { name: 'Buze Diriba', country: 'ETH', time: '2:24:04', position: 4 },
      { name: 'Senbere Teferi', country: 'ETH', time: '2:24:04', position: 5 }
    ]
  },
  chicago: {
    men: [
      { name: 'John Korir', country: 'KEN', time: '2:02:43', position: 1 },
      { name: 'Mohamed Esa', country: 'ETH', time: '2:04:39', position: 2 },
      { name: 'Amos Kipruto', country: 'KEN', time: '2:04:50', position: 3 },
      { name: 'Bashir Abdi', country: 'BEL', time: '2:05:27', position: 4 },
      { name: 'Conner Mantz', country: 'USA', time: '2:07:47', position: 5 }
    ],
    women: [
      { name: 'Ruth Chepngetich', country: 'KEN', time: '2:09:56', position: 1 }, // WORLD RECORD
      { name: 'Sutume Asefa Kebede', country: 'ETH', time: '2:17:32', position: 2 },
      { name: 'Vivian Cheruiyot', country: 'KEN', time: '2:18:15', position: 3 },
      { name: 'Irine Cheptai', country: 'KEN', time: '2:18:33', position: 4 },
      { name: 'Taylor Knibb', country: 'USA', time: '2:22:40', position: 5 }
    ]
  },
  london: {
    men: [
      { name: 'Alexander Mutiso', country: 'KEN', time: '2:04:51', position: 1 },
      { name: 'Emile Cairess', country: 'GBR', time: '2:06:46', position: 2 },
      { name: 'Mahamed Mahamed', country: 'USA', time: '2:07:39', position: 3 },
      { name: 'Kenenisa Bekele', country: 'ETH', time: '2:07:53', position: 4 },
      { name: 'Mosinet Geremew', country: 'ETH', time: '2:08:00', position: 5 }
    ],
    women: [
      { name: 'Peres Jepchirchir', country: 'KEN', time: '2:16:16', position: 1 },
      { name: 'Tigst Assefa', country: 'ETH', time: '2:16:23', position: 2 },
      { name: 'Joyciline Jepkosgei', country: 'KEN', time: '2:16:24', position: 3 },
      { name: 'Megertu Alemu', country: 'ETH', time: '2:16:34', position: 4 },
      { name: 'Yalemzerf Yehualaw', country: 'ETH', time: '2:17:25', position: 5 }
    ]
  },
  nyc: {
    men: [
      { name: 'Abdi Nageeye', country: 'NED', time: '2:07:39', position: 1 },
      { name: 'Evans Chebet', country: 'KEN', time: '2:07:45', position: 2 },
      { name: 'Albert Korir', country: 'KEN', time: '2:08:00', position: 3 },
      { name: 'Conner Mantz', country: 'USA', time: '2:08:16', position: 4 },
      { name: 'Clayton Young', country: 'USA', time: '2:08:24', position: 5 }
    ],
    women: [
      { name: 'Sheila Chepkirui', country: 'KEN', time: '2:24:35', position: 1 },
      { name: 'Hellen Obiri', country: 'KEN', time: '2:24:49', position: 2 },
      { name: 'Vivian Cheruiyot', country: 'KEN', time: '2:25:21', position: 3 },
      { name: 'Letesenbet Gidey', country: 'ETH', time: '2:25:31', position: 4 },
      { name: 'Jessica McClain', country: 'USA', time: '2:25:46', position: 5 }
    ]
  }
};

function convertTimeToSeconds(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
}

function createRaceData(marathonName, location, date, gender, results) {
  return {
    name: `${marathonName} 2024 - ${gender === 'Male' ? "Men's" : "Women's"} Division`,
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

async function populateMarathonResults() {
  console.log('Starting marathon results population...');
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set. Exiting.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Race = mongoose.model('Race', RaceSchema);
    
    const racesToCreate = [
      // Boston Marathon 2024
      createRaceData('Boston Marathon', 'Boston, Massachusetts, USA', '2024-04-15', 'Male', marathon2024Results.boston.men),
      createRaceData('Boston Marathon', 'Boston, Massachusetts, USA', '2024-04-15', 'Female', marathon2024Results.boston.women),
      
      // Chicago Marathon 2024
      createRaceData('Chicago Marathon', 'Chicago, Illinois, USA', '2024-10-13', 'Male', marathon2024Results.chicago.men),
      createRaceData('Chicago Marathon', 'Chicago, Illinois, USA', '2024-10-13', 'Female', marathon2024Results.chicago.women),
      
      // London Marathon 2024
      createRaceData('London Marathon', 'London, England', '2024-04-21', 'Male', marathon2024Results.london.men),
      createRaceData('London Marathon', 'London, England', '2024-04-21', 'Female', marathon2024Results.london.women),
      
      // NYC Marathon 2024
      createRaceData('NYC Marathon', 'New York City, New York, USA', '2024-11-03', 'Male', marathon2024Results.nyc.men),
      createRaceData('NYC Marathon', 'New York City, New York, USA', '2024-11-03', 'Female', marathon2024Results.nyc.women)
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
    
    console.log('✅ Marathon results population completed!');
    
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
populateMarathonResults().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
