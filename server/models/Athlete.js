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
  banReason: {
    type: String
  },
  banSource: {
    type: String
  },
  banAgency: {
    type: String,
    enum: ['AIU', 'WADA', 'USADA', 'RUSADA', 'ADAK', 'IOC', 'IAAF', 'Other']
  },
  banType: {
    type: String
  },
  banDateDetected: {
    type: String
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
    },
    source: {
      type: String
    },
    agency: {
      type: String
    },
    banType: {
      type: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Athlete', AthleteSchema);
