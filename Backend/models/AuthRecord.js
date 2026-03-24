const mongoose = require('mongoose');

const authRecordSchema = new mongoose.Schema({
  // Agent info
  agentName: { type: String, required: true },
  agentEmail: { type: String, default: 'bookings@myfaredeal.com' },

  // Customer info
  customerEmail: { type: String, required: true },
  cardholderName: { type: String, required: true },
  contactNo: { type: String, default: '' },
  
  // Booking info
  bookingReference: { type: String, default: '' },
  companyName: { type: String, default: '' },
  passengers: [{ type: String }],
  
  // Card info (masked)
  cardType: { type: String, default: '' },
  cardLast4: { type: String, default: '' },
  expiryDate: { type: String, default: '' },
  
  // Charge info
  amount: { type: String, default: '' },
  chargeDescription: { type: mongoose.Schema.Types.Mixed, default: [] },
  chargeBreakdown: { type: mongoose.Schema.Types.Mixed, default: [] },
  
  // Auth status
  status: { 
    type: String, 
    enum: ['sent', 'authorized', 'expired'], 
    default: 'sent' 
  },
  token: { type: String, required: true, unique: true },
  
  // Timestamps
  sentAt: { type: Date, default: Date.now },
  authorizedAt: { type: Date, default: null },
  
  // Authorization details
  customerIP: { type: String, default: '' },
  pdfPath: { type: String, default: '' },
  
}, { timestamps: true });

// Index for quick lookups
authRecordSchema.index({ agentName: 1, status: 1 });
authRecordSchema.index({ sentAt: -1 });

module.exports = mongoose.model('AuthRecord', authRecordSchema);
