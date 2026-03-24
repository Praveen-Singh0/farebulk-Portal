const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['login', 'break', 'back', 'logout'], 
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: '' },
}, { timestamps: true });

// Index for fast queries
activityLogSchema.index({ userName: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = { ActivityLog };
