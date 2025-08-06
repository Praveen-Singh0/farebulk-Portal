const mongoose = require('mongoose');

const ticketRequestSchema = new mongoose.Schema({
  // Passenger information
  passengerName: { type: String, required: true },
  passengerEmail: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  

  // Flight / ticket details
  airlineCode: { type: String }, // corrected spelling from airlinesCode to airlineCode
  confirmationCode: { type: String, required: true },
  ticketCost: { type: String, required: true },
  mco: { type: String },
  ticketType: { type: String, required: true },
  requestFor: { type: String, required: true },
  Desc: { type: String, required: true },
  paymentIntentId: { type: String },

  // Consultant
  consultant: { type: String },

  // Status
  status: { type: String, default: "Pending", enum: ['Pending', 'Charge', 'Not Charge'] },

  // Date & time
  date: { type: String },
  time: { type: String },
  datetime: { type: String, required: true },

  // Payment info
  paymentMethod: { type: String },
  cardholderName: { type: String },
  cardNumber: { type: String },
  expiryDate: { type: String },
  cvv: { type: String },

  // Billing info
  billingFirstName: { type: String },
  billingLastName: { type: String },
  billingEmail: { type: String },
  billingPhone: { type: String },
  billingAddress: { type: String },
  billingCity: { type: String },
  billingState: { type: String },
  billingCountry: { type: String }, 
  billingZipCode: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TicketRequest', ticketRequestSchema);
