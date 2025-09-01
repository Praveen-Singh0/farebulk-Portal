// models/CallDescription.js
const mongoose = require('mongoose');

const callDescriptionSchema = new mongoose.Schema({
  sourceNumber: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 12,
    validate: {
      validator: function(v) {
        return /^\d{10,12}$/.test(v);
      },
      message: 'Source number must be 10-12 digits only'
    }
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  callDuration: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Answered', 'Missed', 'Busy', 'Declined', 'No Answer'],
    default: 'Answered'
  },
  callConversation: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
callDescriptionSchema.index({ sourceNumber: 1, date: -1 });
callDescriptionSchema.index({ createdAt: -1 });

const CallDescription = mongoose.model('CallDescription', callDescriptionSchema);

module.exports = { CallDescription };
