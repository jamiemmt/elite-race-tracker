const mongoose = require('mongoose');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jamiemmtcs:y6NfC2uckVdr7EhJ@racedb.cyekzck.mongodb.net/racedb?retryWrites=true&w=majority&appName=racedb';

// 2025 London Marathon Results (April 27, 2025)
const londonMen2025Results = [
  { name: "Sabastian Sawe", country: "KEN", time: "2:02:27", position: 1 },
  { name: "Jacob Kiplimo", country: "UGA", time: "2:03:37", position: 2 },
  { name: "Alexander Mutiso", country: "KEN", time: "2:04:20", position: 3 },
  { name: "Abdi Nageeye", country: "NED", time: "2:04:20", position: 4 },
  { name: "Tamirat Tola", country: "ETH", time: "2:04:42", position: 5 },
  { name: "Eliud Kipchoge", country: "KEN", time: "2:05:25", position: 6 },
  { name: "Hillary Kipkoech", country: "KEN", time: "2:06:05", position: 7 },
  { name: "Amanal Petros", country: "GER", time: "2:06:30", position: 8 },
  { name: "Mahamed Mahamed", country: "GBR", time: "2:08:52", position: 9 },
  { name: "Milkesa Mengesha", country: "ETH", time: "2:09:01", position: 10 }
];

const londonWomen2025Results = [
  { name: "Tigst Assefa", country: "ETH", time: "2:15:50", position: 1 },
  { name: "Joyciline Jepkosgei", country: "KEN", time: "2:18:43", position: 2 },
  { name: "Sifan Hassan", country: "NED", time: "2:18:59", position: 3 },
  { name: "Haven Hailu Desse", country: "ETH", time: "2:19:17", position: 4 },
  { name: "Vivian Cheruiyot", country: "KEN", time: "2:22:32", position: 5 },
  { name: "Stella Chesang", country: "UGA", time: "2:22:42", position: 6 },
  { name: "Sofiia Yaremchuk", country: "ITA", time: "2:23:14", position: 7 },
  { name: "Eilish McColgan", country: "GBR", time: "2:24:25", position: 8 },
  { name: "Rose Harvey", country: "GBR", time: "2:25:01", position: 9 },
  { name: "Susanna Sullivan", country: "USA", time: "2:29:30", position: 10 }
];

function timeToSeconds(timeString) {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function createOrUpdateAthlete(name, country, gender) {
  let athlete = await Athlete.findOne({ name, country });
  if (!athlete) {
    athlete = new Athlete({
      name,
      country,
      gender,
      isBanned: false
    });
    await athlete.save();
    console.log(`Created new athlete: ${name} (${country})`);
  }
  return athlete;
}

async function populateLondon2025Results() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create or update Men's Race
    let menRace = await Race.findOne({ 
      name: "London Marathon 2025 - Men's Division",
      date: new Date('2025-04-27')
    });

    if (!menRace) {
      menRace = new Race({
        name: "London Marathon 2025 - Men's Division",
        date: new Date('2025-04-27'),
        distance: 42195,
        distanceUnit: 'm',
        location: 'London, England',
        category: 'Road',
        gender: 'Male',
        isElite: true,
        results: []
      });
    } else {
      menRace.results = [];
    }

    // Ensure results array exists
    if (!menRace.results) {
      menRace.results = [];
    }

    // Process men's results
    for (const result of londonMen2025Results) {
      const athlete = await createOrUpdateAthlete(result.name, result.country, 'Male');
      const timeInSeconds = timeToSeconds(result.time);
      
      menRace.results.push({
        athlete: {
          name: athlete.name,
          country: athlete.country,
          gender: athlete.gender
        },
        time: timeInSeconds,
        position: result.position,
        formattedTime: result.time
      });
    }

    menRace.lastUpdated = new Date();
    await menRace.save();
    console.log(`✓ Saved London Marathon 2025 Men's results (${londonMen2025Results.length} athletes)`);

    // Create or update Women's Race
    let womenRace = await Race.findOne({ 
      name: "London Marathon 2025 - Women's Division",
      date: new Date('2025-04-27')
    });

    if (!womenRace) {
      womenRace = new Race({
        name: "London Marathon 2025 - Women's Division",
        date: new Date('2025-04-27'),
        distance: 42195,
        distanceUnit: 'm',
        location: 'London, England',
        category: 'Road',
        gender: 'Female',
        isElite: true,
        results: []
      });
    } else {
      womenRace.results = [];
    }

    // Ensure results array exists
    if (!womenRace.results) {
      womenRace.results = [];
    }

    // Process women's results
    for (const result of londonWomen2025Results) {
      const athlete = await createOrUpdateAthlete(result.name, result.country, 'Female');
      const timeInSeconds = timeToSeconds(result.time);
      
      womenRace.results.push({
        athlete: {
          name: athlete.name,
          country: athlete.country,
          gender: athlete.gender
        },
        time: timeInSeconds,
        position: result.position,
        formattedTime: result.time
      });
    }

    womenRace.lastUpdated = new Date();
    await womenRace.save();
    console.log(`✓ Saved London Marathon 2025 Women's results (${londonWomen2025Results.length} athletes)`);

    console.log('\n🎉 Successfully populated 2025 London Marathon results!');
    console.log(`Men's Winner: ${londonMen2025Results[0].name} (${londonMen2025Results[0].country}) - ${londonMen2025Results[0].time}`);
    console.log(`Women's Winner: ${londonWomen2025Results[0].name} (${londonWomen2025Results[0].country}) - ${londonWomen2025Results[0].time}`);

  } catch (error) {
    console.error('Error populating London 2025 results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  populateLondon2025Results();
}

module.exports = { populateLondon2025Results };
