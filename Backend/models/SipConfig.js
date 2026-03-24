const mongoose = require('mongoose');

const sipConfigSchema = new mongoose.Schema({
  userName: { type: String, required: true, unique: true },  // CRM username
  sipExtension: { type: String, required: true },             // SIP extension e.g. "101"
  sipPassword: { type: String, required: true },              // SIP password
  sipDomain: { type: String, required: true },                // SIP domain e.g. "sip.therealpbx.co.uk"
  wssServer: { type: String, required: true },                // WebSocket server e.g. "wss://sip.therealpbx.co.uk:8089/ws"
  displayName: { type: String, default: '' },                 // Caller display name
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const SipConfig = mongoose.model('SipConfig', sipConfigSchema);

module.exports = { SipConfig };
