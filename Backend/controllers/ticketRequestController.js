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

const remove = async (req, res) => {
  try {
    const requestId = req.params.id;

    const deletedRequest = await TicketRequest.findByIdAndDelete(requestId);

    if (!deletedRequest) {
      return res.status(404).json({ message: 'Ticket request not found' });
    }

    res.status(200).json({ message: 'Ticket request deleted successfully' });
  } catch (err) {
    console.error('Error deleting ticket request:', err);
    res.status(500).json({ message: 'Server error while deleting ticket request' });
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


// Update a ticket request
const update = async (req, res) => {
  try {
    const requestId = req.params.id;
    const updatedData = req.body;

    const updatedRequest = await TicketRequest.findByIdAndUpdate(
      requestId,
      updatedData,
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Ticket request not found' });
    }

    res.status(200).json(updatedRequest);
  } catch (err) {
    console.error('Error updating ticket request:', err);
    res.status(500).json({ message: 'Server error while updating ticket request' });
  }
};

module.exports = {
  create,
  getAll,
  update,
  remove
};
