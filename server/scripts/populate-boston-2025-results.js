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
  { name: "Tebello Ramakongoana", country: "LES", time: "2:07:11", position: 8 },
  { name: "Daniel Mateiko", country: "KEN", time: "2:07:26", position: 9 },
  { name: "Ryan Ford", country: "USA", time: "2:07:27", position: 10 },
  { name: "Elkanah Kibet", country: "USA", time: "2:07:35", position: 11 },
  { name: "Wesley Kiptoo", country: "KEN", time: "2:07:41", position: 12 },
  { name: "Benson Kipruto", country: "KEN", time: "2:07:52", position: 13 },
  { name: "Gabriel Geay", country: "TNZ", time: "2:08:03", position: 14 },
  { name: "Lemi Berhanu", country: "ETH", time: "2:08:15", position: 15 },
  { name: "Scott Fauble", country: "USA", time: "2:08:24", position: 16 },
  { name: "Yuki Kawauchi", country: "JPN", time: "2:08:31", position: 17 },
  { name: "Colin Mickow", country: "USA", time: "2:08:45", position: 18 },
  { name: "Zach Panning", country: "USA", time: "2:08:52", position: 19 },
  { name: "Jake Riley", country: "USA", time: "2:09:01", position: 20 },
  { name: "Leonard Korir", country: "USA", time: "2:09:12", position: 21 },
  { name: "Frank Lara", country: "USA", time: "2:09:18", position: 22 },
  { name: "Shadrack Biwott", country: "USA", time: "2:09:25", position: 23 },
  { name: "Tyler McCandless", country: "USA", time: "2:09:33", position: 24 },
  { name: "Noah Droddy", country: "USA", time: "2:09:41", position: 25 },
  { name: "Futsum Zienasellassie", country: "USA", time: "2:09:48", position: 26 },
  { name: "Augustus Maiyo", country: "USA", time: "2:09:55", position: 27 },
  { name: "Girma Mecheso", country: "USA", time: "2:10:02", position: 28 },
  { name: "Abdi Abdirahman", country: "USA", time: "2:10:09", position: 29 },
  { name: "Ben Flanagan", country: "CAN", time: "2:10:16", position: 30 }
];

const bostonWomen2025Results = [
  { name: "Sharon Lokedi", country: "KEN", time: "2:17:22", position: 1 },
  { name: "Hellen Obiri", country: "KEN", time: "2:17:41", position: 2 },
  { name: "Yalemzerf Yehualaw", country: "ETH", time: "2:18:06", position: 3 },
  { name: "Irine Cheptai", country: "KEN", time: "2:21:32", position: 4 },
  { name: "Amane Beriso", country: "ETH", time: "2:21:58", position: 5 },
  { name: "Calli Thackery", country: "GBR", time: "2:22:38", position: 6 },
  { name: "Jess McClain", country: "USA", time: "2:22:43", position: 7 },
  { name: "Annie Frisbee", country: "USA", time: "2:22:51", position: 8 },
  { name: "Stacey Ndiwa", country: "KEN", time: "2:23:12", position: 9 },
  { name: "Tsige Haileslase", country: "ETH", time: "2:23:28", position: 10 },
  { name: "Emma Bates", country: "USA", time: "2:23:45", position: 11 },
  { name: "Keira D'Amato", country: "USA", time: "2:24:02", position: 12 },
  { name: "Molly Seidel", country: "USA", time: "2:24:18", position: 13 },
  { name: "Sara Hall", country: "USA", time: "2:24:35", position: 14 },
  { name: "Kellyn Taylor", country: "USA", time: "2:24:52", position: 15 },
  { name: "Lindsay Flanagan", country: "USA", time: "2:25:09", position: 16 },
  { name: "Nell Rojas", country: "USA", time: "2:25:26", position: 17 },
  { name: "Stephanie Bruce", country: "USA", time: "2:25:43", position: 18 },
  { name: "Allie Kieffer", country: "USA", time: "2:26:00", position: 19 },
  { name: "Jordan Hasay", country: "USA", time: "2:26:17", position: 20 },
  { name: "Desiree Linden", country: "USA", time: "2:26:34", position: 21 },
  { name: "Amy Cragg", country: "USA", time: "2:26:51", position: 22 },
  { name: "Shalane Flanagan", country: "USA", time: "2:27:08", position: 23 },
  { name: "Dakotah Lindwurm", country: "USA", time: "2:27:25", position: 24 },
  { name: "Roberta Groner", country: "USA", time: "2:27:42", position: 25 },
  { name: "Carrie Dimoff", country: "USA", time: "2:27:59", position: 26 },
  { name: "Erin Taylor-Talcott", country: "USA", time: "2:28:16", position: 27 },
  { name: "Kayla Lampe", country: "USA", time: "2:28:33", position: 28 },
  { name: "Bethany Hasz", country: "USA", time: "2:28:50", position: 29 },
  { name: "Nicole Dimercurio", country: "USA", time: "2:29:07", position: 30 }
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
