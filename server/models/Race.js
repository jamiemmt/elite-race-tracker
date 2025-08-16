const mongoose = require('mongoose');

const RaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
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
  category: {
    type: String,
    enum: ['Track', 'Road', 'Cross Country', 'Trail', 'Ultra', 'Other'],
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Mixed'],
    required: true
  },
  isElite: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Race', RaceSchema);
