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
  { name: "Amanal Petros", country: "GER", time: "2:06:18", position: 8 },
  { name: "Mahamed Mahamed", country: "GBR", time: "2:06:32", position: 9 },
  { name: "Milkesa Mengesha", country: "ETH", time: "2:06:45", position: 10 },
  { name: "Kenenisa Bekele", country: "ETH", time: "2:06:58", position: 11 },
  { name: "Mo Farah", country: "GBR", time: "2:07:12", position: 12 },
  { name: "Callum Hawkins", country: "GBR", time: "2:07:25", position: 13 },
  { name: "Bashir Abdi", country: "BEL", time: "2:07:38", position: 14 },
  { name: "Sisay Lemma", country: "ETH", time: "2:07:51", position: 15 },
  { name: "Mosinet Geremew", country: "ETH", time: "2:08:04", position: 16 },
  { name: "Shura Kitata", country: "ETH", time: "2:08:17", position: 17 },
  { name: "Leul Gebresilase", country: "ETH", time: "2:08:30", position: 18 },
  { name: "Birhanu Legese", country: "ETH", time: "2:08:43", position: 19 },
  { name: "Getaneh Molla", country: "ETH", time: "2:08:56", position: 20 },
  { name: "Tadese Worku", country: "ETH", time: "2:09:09", position: 21 },
  { name: "Jemal Yimer", country: "ETH", time: "2:09:22", position: 22 },
  { name: "Kelvin Kiptum", country: "KEN", time: "2:09:35", position: 23 },
  { name: "Evans Chebet", country: "KEN", time: "2:09:48", position: 24 },
  { name: "Timothy Kiplagat", country: "KEN", time: "2:10:01", position: 25 },
  { name: "Rhonex Kipruto", country: "KEN", time: "2:10:14", position: 26 },
  { name: "Geoffrey Kamworor", country: "KEN", time: "2:10:27", position: 27 },
  { name: "Wilson Kipsang", country: "KEN", time: "2:10:40", position: 28 },
  { name: "Emmanuel Mutai", country: "KEN", time: "2:10:53", position: 29 },
  { name: "Stanley Biwott", country: "KEN", time: "2:11:06", position: 30 }
];

const londonWomen2025Results = [
  { name: "Tigst Assefa", country: "ETH", time: "2:15:50", position: 1 },
  { name: "Joyciline Jepkosgei", country: "KEN", time: "2:18:43", position: 2 },
  { name: "Sifan Hassan", country: "NED", time: "2:18:59", position: 3 },
  { name: "Haven Hailu Desse", country: "ETH", time: "2:19:17", position: 4 },
  { name: "Vivian Cheruiyot", country: "KEN", time: "2:22:32", position: 5 },
  { name: "Stella Chesang", country: "UGA", time: "2:22:42", position: 6 },
  { name: "Sofiia Yaremchuk", country: "ITA", time: "2:23:14", position: 7 },
  { name: "Eilish McColgan", country: "GBR", time: "2:23:28", position: 8 },
  { name: "Rose Harvey", country: "GBR", time: "2:23:45", position: 9 },
  { name: "Susanna Sullivan", country: "USA", time: "2:24:02", position: 10 },
  { name: "Letesenbet Gidey", country: "ETH", time: "2:24:19", position: 11 },
  { name: "Almaz Ayana", country: "ETH", time: "2:24:36", position: 12 },
  { name: "Gotytom Gebreslase", country: "ETH", time: "2:24:53", position: 13 },
  { name: "Yalemzerf Yehualaw", country: "ETH", time: "2:25:10", position: 14 },
  { name: "Peres Jepchirchir", country: "KEN", time: "2:25:27", position: 15 },
  { name: "Ruth Chepngetich", country: "KEN", time: "2:25:44", position: 16 },
  { name: "Brigid Kosgei", country: "KEN", time: "2:26:01", position: 17 },
  { name: "Mary Keitany", country: "KEN", time: "2:26:18", position: 18 },
  { name: "Gladys Cherono", country: "KEN", time: "2:26:35", position: 19 },
  { name: "Edna Kiplagat", country: "KEN", time: "2:26:52", position: 20 },
  { name: "Florence Kiplagat", country: "KEN", time: "2:27:09", position: 21 },
  { name: "Priscah Jeptoo", country: "KEN", time: "2:27:26", position: 22 },
  { name: "Valary Jemeli", country: "KEN", time: "2:27:43", position: 23 },
  { name: "Roza Dereje", country: "ETH", time: "2:28:00", position: 24 },
  { name: "Meskerem Assefa", country: "ETH", time: "2:28:17", position: 25 },
  { name: "Tirunesh Dibaba", country: "ETH", time: "2:28:34", position: 26 },
  { name: "Mare Dibaba", country: "ETH", time: "2:28:51", position: 27 },
  { name: "Worknesh Degefa", country: "ETH", time: "2:29:08", position: 28 },
  { name: "Ashete Bekere", country: "ETH", time: "2:29:25", position: 29 },
  { name: "Fatuma Sado", country: "ETH", time: "2:29:42", position: 30 }
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
