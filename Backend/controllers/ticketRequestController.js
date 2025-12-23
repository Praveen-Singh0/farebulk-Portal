const TicketRequest = require('../models/TicketRequest');
const { convertCurrency, getExchangeRate } = require('../utils/currencyConverter');

// Create new ticket request
const create = async (req, res) => {
  try {
    const requestData = req.body;
    
    // Handle currency conversion if currency is provided
    if (requestData.currency && requestData.currency !== 'USD') {
      const currency = requestData.currency;
      const exchangeRate = getExchangeRate(currency, 'USD');
      
      // Convert ticket cost to USD
      if (requestData.ticketCost) {
        const ticketCostUSD = convertCurrency(
          parseFloat(requestData.ticketCost),
          currency,
          'USD'
        );
        requestData.ticketCostUSD = ticketCostUSD.toString();
      }
      
      // Convert MCO to USD
      if (requestData.mco) {
        const mcoUSD = convertCurrency(
          parseFloat(requestData.mco),
          currency,
          'USD'
        );
        requestData.mcoUSD = mcoUSD.toString();
      }
      
      requestData.exchangeRate = exchangeRate;
    } else {
      // If USD or no currency specified, set USD values same as original
      requestData.currency = 'USD';
      requestData.exchangeRate = 1;
      requestData.ticketCostUSD = requestData.ticketCost;
      requestData.mcoUSD = requestData.mco;
    }
    
    const newRequest = new TicketRequest(requestData);
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

    // Handle currency conversion if currency changed
    if (updatedData.currency && updatedData.currency !== 'USD') {
      const currency = updatedData.currency;
      const exchangeRate = getExchangeRate(currency, 'USD');
      
      // Convert ticket cost to USD
      if (updatedData.ticketCost) {
        const ticketCostUSD = convertCurrency(
          parseFloat(updatedData.ticketCost),
          currency,
          'USD'
        );
        updatedData.ticketCostUSD = ticketCostUSD.toString();
      }
      
      // Convert MCO to USD
      if (updatedData.mco) {
        const mcoUSD = convertCurrency(
          parseFloat(updatedData.mco),
          currency,
          'USD'
        );
        updatedData.mcoUSD = mcoUSD.toString();
      }
      
      updatedData.exchangeRate = exchangeRate;
    } else if (updatedData.currency === 'USD') {
      updatedData.exchangeRate = 1;
      updatedData.ticketCostUSD = updatedData.ticketCost;
      updatedData.mcoUSD = updatedData.mco;
    }

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
