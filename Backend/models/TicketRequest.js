const mongoose = require('mongoose');

const ticketRequestSchema = new mongoose.Schema({
  passengerName: { type: String, required: true },
  passengerEmail: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  airlinesCode: { type: String, },
  confirmationCode: { type: String, required: true },
  ticketCost: { type: String, required: true },
  mco: { type: String },
  paymentMethod: { type: String },
  cardholderName: { type: String },
  cardNumber: { type: String },
  expiryDate: { type: String },
  cvv: { type: String },
  date: { type: String },
  time: { type: String },
  datetime: { type: String, required: true },
  consultant: { type: String },
  ticketType: { type: String, required: true },
  requestFor: { type: String, required: true },
  Desc: { type: String, required: true },
  status: { type: String, default: "Pending", enum: ['Pending', 'Charge', 'Not Charge'] }
}, { timestamps: true });

module.exports = mongoose.model('TicketRequest', ticketRequestSchema);