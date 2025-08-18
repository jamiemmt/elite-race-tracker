/**
 * Script to run all scrapers and store results in MongoDB
 * This script is meant to be executed by Heroku Scheduler
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB Race model schema - simplified version for scheduler use
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

// Import all scrapers
const scrapersDir = path.join(__dirname, '../scrapers/sites');
const scrapers = {};

async function loadScrapers() {
  console.log('Loading scrapers...');
  
  // Load all scrapers from the sites directory
  try {
    fs.readdirSync(scrapersDir).forEach(file => {
      if (file.endsWith('.js')) {
        const scraperName = file.replace('.js', '');
        try {
          const scraperModule = require(path.join(scrapersDir, file));
          scrapers[scraperName] = scraperModule;
          console.log(`Loaded scraper: ${scraperName}`);
        } catch (err) {
          console.error(`Error loading scraper ${file}:`, err);
        }
      }
    });
  } catch (error) {
    console.error('Error loading scrapers directory:', error);
  }
  
  console.log(`Loaded ${Object.keys(scrapers).length} scrapers`);
}

async function runAllScrapers() {
  console.log('Starting scraper run at:', new Date().toISOString());
  
  // Connect to MongoDB
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is not set. Exiting.');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Register Race model
    const Race = mongoose.model('Race', RaceSchema);
    
    // Run each scraper
    for (const [name, Scraper] of Object.entries(scrapers)) {
      try {
        console.log(`Running ${name} scraper...`);
        const scraperInstance = typeof Scraper === 'function' ? new Scraper() : Scraper;
        
        let results;
        if (typeof scraperInstance.scrape === 'function') {
          results = await scraperInstance.scrape({});
        } else if (typeof scraperInstance.scrapeResults === 'function') {
          results = await scraperInstance.scrapeResults({});
        } else {
          console.error(`No scrape or scrapeResults method found for ${name}`);
          continue;
        }
        
        console.log(`${name} scraper returned ${results.length} results`);
        
        // Group results by race
        const raceResults = {};
        
        for (const result of results) {
          const raceKey = `${result.race.name}-${result.race.date}`;
          
          if (!raceResults[raceKey]) {
            raceResults[raceKey] = {
              race: result.race,
              results: []
            };
          }
          
          raceResults[raceKey].results.push({
            athlete: result.athlete,
            time: result.result.time,
            position: result.result.position,
            formattedTime: result.result.formattedTime
          });
        }
        
        // Save each race to MongoDB
        for (const [_, data] of Object.entries(raceResults)) {
          const { race, results } = data;
          
          try {
            // Check if race already exists
            const existingRace = await Race.findOne({
              name: race.name,
              date: race.date
            });
            
            if (existingRace) {
              // Update existing race
              existingRace.results = results;
              existingRace.lastUpdated = new Date();
              await existingRace.save();
              console.log(`Updated race: ${race.name}`);
            } else {
              // Create new race
              const newRace = new Race({
                ...race,
                results
              });
              await newRace.save();
              console.log(`Created new race: ${race.name}`);
            }
          } catch (error) {
            console.error(`Error saving race ${race.name}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error running ${name} scraper:`, error);
      }
    }
    
    console.log('All scrapers completed at:', new Date().toISOString());
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Main execution
async function main() {
  try {
    await loadScrapers();
    await runAllScrapers();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
