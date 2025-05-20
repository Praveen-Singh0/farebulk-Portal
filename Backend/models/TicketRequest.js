const mongoose = require('mongoose');

const ticketRequestSchema = new mongoose.Schema({
  date: String,
  passenger: String,
  email: String,
  airline: String,
  confirmation: String,
  amount: Number,
  mco: Number,
  status: { type: String, enum: ['Pending', 'Confirmed'], default: 'Pending' },
  creditCard: {
    number: String,
    nameOnCard: String,
    expiryDate: String,
    cvv: String
  }
});

module.exports = mongoose.model('TicketRequest', ticketRequestSchema); 