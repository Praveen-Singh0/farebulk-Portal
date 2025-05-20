const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'travel_consultant', 'ticket_consultant'], required: true },
  name: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema); 