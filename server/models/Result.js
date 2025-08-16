const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
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
  finishTime: {
    type: Number,  // Store time in seconds for easy comparison
    required: true
  },
  formattedTime: {
    type: String,  // Store human-readable time (HH:MM:SS.ms)
    required: true
  },
  position: {
    type: Number
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index to ensure uniqueness of athlete-race combination
ResultSchema.index({ athlete: 1, race: 1 }, { unique: true });

module.exports = mongoose.model('Result', ResultSchema);
