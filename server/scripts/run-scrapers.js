/**
 * Script to run all scrapers for production deployment
 * This is used by the cron job in production to regularly update race data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bostonMarathon = require('../scrapers/sites/bostonmarathon');
const chicagoMarathon = require('../scrapers/sites/chicagomarathon');
const nycMarathon = require('../scrapers/sites/nycmarathon');
const londonMarathon = require('../scrapers/sites/londonmarathon');
const berlinMarathon = require('../scrapers/sites/berlinmarathon');
const tokyoMarathon = require('../scrapers/sites/tokyomarathon');
const worldAthletics = require('../scrapers/sites/worldathletics');
const aiu = require('../scrapers/sites/aiu');

// MongoDB connection string
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB Connected');
    runAllScrapers();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

async function runAllScrapers() {
  try {
    console.log('Starting all scrapers...');
    
    // Marathon scrapers
    console.log('Running Boston Marathon scraper...');
    await bostonMarathon.scrapeResults();
    
    console.log('Running Chicago Marathon scraper...');
    await chicagoMarathon.scrapeResults();
    
    console.log('Running NYC Marathon scraper...');
    await nycMarathon.scrapeResults();
    
    console.log('Running London Marathon scraper...');
    await londonMarathon.scrapeResults();
    
    console.log('Running Berlin Marathon scraper...');
    await berlinMarathon.scrapeResults();
    
    console.log('Running Tokyo Marathon scraper...');
    await tokyoMarathon.scrapeResults();
    
    // Other scrapers
    console.log('Running World Athletics scraper...');
    await worldAthletics.scrapeResults();
    
    console.log('Running AIU banned athletes scraper...');
    await aiu.scrapeResults();
    
    console.log('All scrapers completed successfully!');
    
    // Disconnect from MongoDB after all scrapers are done
    mongoose.disconnect();
    console.log('MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error running scrapers:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}
