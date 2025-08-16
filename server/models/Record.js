const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['World', 'Continental', 'National', 'SeasonBest'],
    required: true
  },
  distance: {
    type: Number,
    required: true
  },
  distanceUnit: {
    type: String,
    enum: ['m', 'km', 'miles'],
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Mixed'],
    required: true
  },
  surface: {
    type: String,
    enum: ['Track', 'Road', 'Indoor Track', 'Cross Country', 'Trail'],
    required: true
  },
  time: {
    type: Number,  // In seconds
    required: true
  },
  formattedTime: {
    type: String,  // Human-readable format (HH:MM:SS.ms)
    required: true
  },
  athlete: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  race: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Race',
    required: true
  },
  result: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result',
    required: true
  },
  country: {
    type: String,
    required: function() {
      return this.type === 'National';
    }
  },
  continent: {
    type: String,
    required: function() {
      return this.type === 'Continental';
    }
  },
  year: {
    type: Number,
    required: function() {
      return this.type === 'SeasonBest';
    }
  },
  dateSet: {
    type: Date,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for uniqueness
RecordSchema.index(
  { 
    type: 1, 
    distance: 1, 
    distanceUnit: 1, 
    gender: 1, 
    surface: 1,
    country: 1,
    continent: 1,
    year: 1
  }, 
  { 
    unique: true,
    partialFilterExpression: {
      country: { $exists: true },
      continent: { $exists: true },
      year: { $exists: true }
    }
  }
);

module.exports = mongoose.model('Record', RecordSchema);
