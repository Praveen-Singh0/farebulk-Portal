const mongoose = require('mongoose');

const ticketRequestStatusSchema = new mongoose.Schema({
  ticketRequest: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Charge', 'Not Charge']
  },
  paymentMethod: {
    type: String,
  },
  remark: {
    type: String
  },
  updatedBy: {
    type: String, 
    required: true
  },
  paymentIntentId: { type: String },
  
  // Multi-currency support - store currency info at time of status update
  currency: { type: String },
  saleAmountOriginal: { type: Number }, // Sale in original currency
  saleAmountUSD: { type: Number }, // Sale converted to USD
  exchangeRate: { type: Number }

}, { timestamps: true });

module.exports = mongoose.model('TicketRequestStatus', ticketRequestStatusSchema);