const TicketRequest = require('../models/TicketRequest');

// Create new ticket request
const create = async (req, res) => {
  try {
    const newRequest = new TicketRequest(req.body);
    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (err) {
    console.error('Error creating ticket request:', err);
    res.status(500).json({ message: 'Server error while creating ticket request' });
  }
};

// Get all ticket requests
const getAll = async (req, res) => { 
  try {
    const requests = await TicketRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching ticket requests:', err);
    res.status(500).json({ message: 'Server error while fetching ticket requests' });
  }
};


// Upadte Status of ticket 
const updateStatus = async (req, res) => {
  try {

  } catch (err) {


  }
};

module.exports = {
  create,
  getAll,
  updateStatus
};
