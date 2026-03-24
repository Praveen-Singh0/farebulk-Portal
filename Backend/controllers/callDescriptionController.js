// controllers/callDescriptionController.js
const { CallDescription } = require('../models/CallDescription');

// Create a new call description
const createCallDescription = async (req, res) => {
  try {
    const { apiData } = req.body;
    
    if (!apiData) {
      return res.status(400).json({ 
        success: false, 
        message: 'API data is required' 
      });
    }

    // Validate required fields
    const { sourceNumber, destination, callDuration, status, callConversation, date, user } = apiData;
    
    if (!sourceNumber || !destination || !callDuration || !callConversation || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Validate source number format
    if (!/^\d{10,12}$/.test(sourceNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Source number must be 10-12 digits only' 
      });
    }

    // Create new call description
    const newCallDescription = new CallDescription({
      sourceNumber: sourceNumber.trim(),
      destination: destination.trim(),
      callDuration: callDuration.trim(),
      status: status || 'Answered',
      callConversation: callConversation.trim(),
      date: date.trim(),
      user: user ? user.trim() : 'Unknown'
    });

    const savedCallDescription = await newCallDescription.save();

    res.status(201).json({
      success: true,
      message: 'Call description saved successfully',
      data: savedCallDescription
    });

  } catch (error) {
    console.error('Error creating call description:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
};

// Get all call descriptions with pagination and filtering
const getAllCallDescriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 500;
    const skip = (page - 1) * limit;

    // Filter options
    const filter = {};
    if (req.query.sourceNumber) {
      filter.sourceNumber = { $regex: req.query.sourceNumber, $options: 'i' };
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.date) {
      filter.date = req.query.date;
    }
    if (req.query.user) {
      filter.user = req.query.user;
    }

    const callDescriptions = await CallDescription.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CallDescription.countDocuments(filter);

    res.json({
      success: true,
      data: callDescriptions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching call descriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get call description by ID
const getCallDescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const callDescription = await CallDescription.findById(id);

    if (!callDescription) {
      return res.status(404).json({
        success: false,
        message: 'Call description not found'
      });
    }

    res.json({
      success: true,
      data: callDescription
    });

  } catch (error) {
    console.error('Error fetching call description:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update call description
const updateCallDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { apiData } = req.body;

    if (!apiData) {
      return res.status(400).json({ 
        success: false, 
        message: 'API data is required' 
      });
    }

    const updatedCallDescription = await CallDescription.findByIdAndUpdate(
      id,
      { ...apiData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedCallDescription) {
      return res.status(404).json({
        success: false,
        message: 'Call description not found'
      });
    }

    res.json({
      success: true,
      message: 'Call description updated successfully',
      data: updatedCallDescription
    });

  } catch (error) {
    console.error('Error updating call description:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete call description
const deleteCallDescription = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCallDescription = await CallDescription.findByIdAndDelete(id);

    if (!deletedCallDescription) {
      return res.status(404).json({
        success: false,
        message: 'Call description not found'
      });
    }

    res.json({
      success: true,
      message: 'Call description deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting call description:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createCallDescription,
  getAllCallDescriptions,
  getCallDescriptionById,
  updateCallDescription,
  deleteCallDescription
};
