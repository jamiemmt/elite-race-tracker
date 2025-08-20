const mongoose = require('mongoose');
const Race = require('../models/Race');
const Athlete = require('../models/Athlete');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jamiemmtcs:y6NfC2uckVdr7EhJ@racedb.cyekzck.mongodb.net/racedb?retryWrites=true&w=majority&appName=racedb';

// 2025 Boston Marathon Results (April 21, 2025)
const bostonMen2025Results = [
  { name: "John Korir", country: "KEN", time: "2:04:45", position: 1 },
  { name: "Alphonce Felix Simbu", country: "TNZ", time: "2:05:04", position: 2 },
  { name: "CyBrian Kotut", country: "KEN", time: "2:05:04", position: 3 },
  { name: "Conner Mantz", country: "USA", time: "2:05:08", position: 4 },
  { name: "Muktar Edris", country: "ETH", time: "2:05:59", position: 5 },
  { name: "Rory Linkletter", country: "CAN", time: "2:07:02", position: 6 },
  { name: "Clayton Young", country: "USA", time: "2:07:04", position: 7 },
  { name: "Tebello Ramakongoana", country: "LES", time: "2:07:19", position: 8 },
  { name: "Daniel Mateiko", country: "KEN", time: "2:07:52", position: 9 },
  { name: "Ryan Ford", country: "USA", time: "2:08:00", position: 10 }
];

const bostonWomen2025Results = [
  { name: "Sharon Lokedi", country: "KEN", time: "2:17:22", position: 1 },
  { name: "Hellen Obiri", country: "KEN", time: "2:17:41", position: 2 },
  { name: "Yalemzerf Yehualaw", country: "ETH", time: "2:18:06", position: 3 },
  { name: "Irine Cheptai", country: "KEN", time: "2:21:32", position: 4 },
  { name: "Amane Beriso", country: "ETH", time: "2:21:58", position: 5 },
  { name: "Calli Thackery", country: "GBR", time: "2:22:38", position: 6 },
  { name: "Jess McClain", country: "USA", time: "2:22:43", position: 7 },
  { name: "Annie Frisbee", country: "USA", time: "2:23:21", position: 8 },
  { name: "Stacey Ndiwa", country: "KEN", time: "2:23:29", position: 9 },
  { name: "Tsige Haileslase", country: "ETH", time: "2:23:43", position: 10 }
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

async function populateBoston2025Results() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create or update Men's Race
    let menRace = await Race.findOne({ 
      name: "Boston Marathon 2025 - Men's Division",
      date: new Date('2025-04-21')
    });

    if (!menRace) {
      menRace = new Race({
        name: "Boston Marathon 2025 - Men's Division",
        date: new Date('2025-04-21'),
        distance: 42195,
        distanceUnit: 'm',
        location: 'Boston, Massachusetts, USA',
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
    for (const result of bostonMen2025Results) {
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
    console.log(`✓ Saved Boston Marathon 2025 Men's results (${bostonMen2025Results.length} athletes)`);

    // Create or update Women's Race
    let womenRace = await Race.findOne({ 
      name: "Boston Marathon 2025 - Women's Division",
      date: new Date('2025-04-21')
    });

    if (!womenRace) {
      womenRace = new Race({
        name: "Boston Marathon 2025 - Women's Division",
        date: new Date('2025-04-21'),
        distance: 42195,
        distanceUnit: 'm',
        location: 'Boston, Massachusetts, USA',
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
    for (const result of bostonWomen2025Results) {
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
    console.log(`✓ Saved Boston Marathon 2025 Women's results (${bostonWomen2025Results.length} athletes)`);

    console.log('\n🎉 Successfully populated 2025 Boston Marathon results!');
    console.log(`Men's Winner: ${bostonMen2025Results[0].name} (${bostonMen2025Results[0].country}) - ${bostonMen2025Results[0].time}`);
    console.log(`Women's Winner: ${bostonWomen2025Results[0].name} (${bostonWomen2025Results[0].country}) - ${bostonWomen2025Results[0].time}`);

  } catch (error) {
    console.error('Error populating Boston 2025 results:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  populateBoston2025Results();
}

module.exports = { populateBoston2025Results };
