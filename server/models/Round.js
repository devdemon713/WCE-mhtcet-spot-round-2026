const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Spot Round 2025-26'
  },
  status: {
    type: String,
    enum: ['demo', 'setup', 'active', 'paused', 'completed'],
    default: 'demo'
  },
  isDemo: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: 'Demo round with sample data'
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  totalSeatsInitial: {
    type: Number,
    default: 0
  },
  totalSeatsAllocated: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Round', roundSchema);
