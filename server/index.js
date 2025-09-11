const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const athleteRoutes = require('./routes/athletes');
const raceRoutes = require('./routes/races');
const resultRoutes = require('./routes/results');
const scraperRoutes = require('./routes/scrapers');
const raceResultsRoutes = require('./routes/raceResults');
const scraperSchedulerRoutes = require('./routes/scraperScheduler');
const bannedAthleteRoutes = require('./routes/bannedAthletes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Register routes as middleware
app.use('/api/athletes', athleteRoutes);
app.use('/api/races', raceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/scrapers', scraperRoutes);
app.use('/api/race-results', raceResultsRoutes);
app.use('/api/scraper-scheduler', scraperSchedulerRoutes);
app.use('/api/banned-athletes', bannedAthleteRoutes);
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api/cleanup', require('./routes/cleanup'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/clean-results', require('./routes/cleanResults'));
app.use('/api/reset-diamond-league', require('./routes/resetDiamondLeague'));
app.use('/api/complete-reset', require('./routes/completeReset'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/elite-race-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
