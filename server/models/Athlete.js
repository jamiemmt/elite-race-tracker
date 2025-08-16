const mongoose = require('mongoose');

const AthleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banHistory: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date
    },
    reason: {
      type: String,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Athlete', AthleteSchema);
