/**
 * MongoDB connection test script
 * Use this to verify and diagnose MongoDB connection issues
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Get MongoDB URI from environment or args
const mongoUri = process.env.MONGODB_URI || process.argv[2];

if (!mongoUri) {
  console.error('No MongoDB URI provided. Please provide as argument or set MONGODB_URI environment variable.');
  console.log('Usage: node verify-mongodb.js "mongodb+srv://username:password@cluster.mongodb.net/database"');
  process.exit(1);
}

// Mask password in logs
const maskedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
console.log(`Testing connection to: ${maskedUri}`);

// Clean and normalize URI if needed
let normalizedUri = mongoUri.trim();

// Make sure we're using the srv format for Atlas
if (normalizedUri.includes('mongodb.net') && !normalizedUri.startsWith('mongodb+srv://')) {
  console.log('Detected MongoDB Atlas connection string without +srv protocol, adjusting...');
  normalizedUri = normalizedUri.replace('mongodb://', 'mongodb+srv://');
}

// Connect with detailed settings
mongoose.connect(normalizedUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Longer timeout for testing
  heartbeatFrequencyMS: 10000
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  console.log('Connection details:');
  console.log(`- Host: ${mongoose.connection.host}`);
  console.log(`- Port: ${mongoose.connection.port || 'default'}`);
  console.log(`- Database: ${mongoose.connection.name}`);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  
  // Detailed diagnostics based on error type
  if (err.name === 'MongoServerSelectionError') {
    if (err.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\nDiagnosis: DNS resolution failure');
      console.error('Could not resolve the MongoDB hostname. If using MongoDB Atlas, make sure:');
      console.error('1. You are using mongodb+srv:// protocol for Atlas connections');
      console.error('2. The cluster name and domain are correct');
      console.error('3. Your network allows DNS resolution of MongoDB Atlas domains');
    } else if (err.message.includes('authentication failed')) {
      console.error('\nDiagnosis: Authentication failure');
      console.error('1. Check that username and password are correct');
      console.error('2. Verify the user has appropriate access rights to the database');
      console.error('3. Make sure special characters in password are properly URL encoded');
    } else {
      console.error('\nDiagnosis: Server selection timeout');
      console.error('1. Check if MongoDB service is running');
      console.error('2. Verify network connectivity to MongoDB server');
      console.error('3. Check firewall settings and IP whitelist (for Atlas)');
    }
  } else if (err.name === 'MongoParseError') {
    console.error('\nDiagnosis: Invalid connection string format');
    console.error('Expected format for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error('Expected format for regular MongoDB: mongodb://hostname:port/database');
  }
  
  // If it's an Atlas connection, show recommended format
  if (normalizedUri.includes('mongodb.net')) {
    console.log('\nRecommended connection string format for MongoDB Atlas:');
    console.log('mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database?retryWrites=true&w=majority');
  }
  
  process.exit(1);
});
