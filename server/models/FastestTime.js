const mongoose = require('mongoose');

/**
 * Schema for tracking fastest times
 * - Tracks both all-time and current year fastest times
 * - Distinguishes between WR-eligible and non-eligible marks
 */
const FastestTimeSchema = new mongoose.Schema({
  // Reference to the race distance/event
  event: {
    type: String, 
    required: true,
    index: true
  },
  
  // Distance in meters
  distance: {
    type: Number,
    required: true
  },
  
  // Gender category (Male, Female, Nonbinary)
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Nonbinary'],
    required: true
  },
  
  // Fastest all-time WR-eligible mark
  allTimeWrEligible: {
    time: Number,
    formattedTime: String,
    athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
    date: Date
  },
  
  // Fastest all-time non-WR-eligible mark
  allTimeNonWrEligible: {
    time: Number,
    formattedTime: String,
    athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
    date: Date,
    reason: String // Reason mark is not WR-eligible (e.g., "Excessive tailwind", "Downhill course", etc.)
  },
  
  // Fastest current year WR-eligible mark
  currentYearWrEligible: {
    time: Number,
    formattedTime: String,
    athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
    date: Date,
    year: Number
  },
  
  // Fastest current year non-WR-eligible mark
  currentYearNonWrEligible: {
    time: Number,
    formattedTime: String,
    athleteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Athlete' },
    raceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Race' },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },
    date: Date,
    year: Number,
    reason: String // Reason mark is not WR-eligible
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Compound index for quick lookup
FastestTimeSchema.index({ event: 1, gender: 1 });

module.exports = mongoose.model('FastestTime', FastestTimeSchema);
