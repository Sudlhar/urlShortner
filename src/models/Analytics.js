const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  referrer: {
    type: String,
  },
  deviceType: {
    type: String, // 'mobile', 'desktop', 'tablet', etc.
  }
});

// Index for aggregation by day
analyticsSchema.index({ shortCode: 1, timestamp: -1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
