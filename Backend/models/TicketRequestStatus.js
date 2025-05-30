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
  }
}, { timestamps: true });

module.exports = mongoose.model('TicketRequestStatus', ticketRequestStatusSchema);