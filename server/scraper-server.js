const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const scraperRoutes = require('./routes/scrapers');
const racesRoutes = require('./routes/races');
const scraperSchedulerRoutes = require('./routes/scraperScheduler');
const bannedAthleteRoutes = require('./routes/bannedAthletes');
const diamondLeague2025Routes = require('./routes/diamondLeague2025');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Connect to MongoDB if URI is provided
const ENV_MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (ENV_MONGO_URI) {
  // Clean up and normalize MongoDB URI - handle potential issues
  let mongoUri = ENV_MONGO_URI.trim();
  
  // Make sure we're using the srv format for Atlas
  if (mongoUri.includes('mongodb.net') && !mongoUri.startsWith('mongodb+srv://')) {
    console.log('Detected MongoDB Atlas connection string without +srv protocol, adjusting...');
    mongoUri = mongoUri.replace('mongodb://', 'mongodb+srv://');
  }

  console.log(`Connecting to MongoDB with URI pattern: ${mongoUri.replace(/\/\/([^:]+):[^@]+@/, '//\\1:****@')}`);
  
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
    heartbeatFrequencyMS: 10000, // Default is 10000
    retryWrites: true,
  })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      
      // Provide more detailed error messages based on error type
      if (err.name === 'MongoServerSelectionError') {
        if (err.message.includes('getaddrinfo ENOTFOUND')) {
          console.error('DNS resolution failed: Could not resolve the MongoDB hostname. ' +
            'If using MongoDB Atlas, ensure you are using mongodb+srv:// protocol.');
        } else if (err.message.includes('connection timed out')) {
          console.error('Connection timeout: Check network connectivity and MongoDB service availability.');
        } else {
          console.error('Server selection error: ' + err.message);
        }
      } else if (err.name === 'MongoParseError') {
        console.error('Invalid connection string format: ' + err.message);
        console.error('Expected format: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>');
      } else if (err.name === 'MongooseServerSelectionError') {
        console.error('Could not select a MongoDB server: ' + err.message);
      }
      
      console.log('Running without database connection. Scrapers will work but data won\'t be saved.');
    });
} else {
  console.log('No MongoDB URI provided. Running without database connection.');
}

// Register routes
app.use('/api/scrapers', scraperRoutes);
app.use('/api/races', racesRoutes);
app.use('/api/scraper-scheduler', scraperSchedulerRoutes);
app.use('/api/banned-athletes', bannedAthleteRoutes);
app.use('/api/diamond-league-2025', diamondLeague2025Routes);
app.use('/api/results', require('./routes/results'));
app.use('/api/athletes', require('./routes/athletes'));

// Health check API endpoint is now defined inside the environment-specific blocks

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  const clientBuildPath = path.join(__dirname, '../client/build');
  
  app.use(express.static(clientBuildPath));
  
  // API health check endpoint - moved before the catch-all route
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'Clean So Far Service is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Skip API routes
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
  
  console.log('Serving React frontend from:', clientBuildPath);
} else {
  // Basic route for development when frontend is served separately
  app.get('/', (req, res) => {
    res.json({ 
      status: 'Clean So Far Scraper Server is running',
      timestamp: new Date().toISOString(),
      note: 'In development mode. Frontend should be served separately.'
    });
  });
  
  // Health check endpoint for development mode
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'Clean So Far Service is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
