const TicketRequestStatus = require('../models/TicketRequestStatus');
const TicketRequest = require('../models/TicketRequest');
const { User } = require('../models/User');

const createTicketRequestStatus = async (req, res) => {
  try {
    const { ticketRequestId, ticketRequest, status, paymentMethod, remark } = req.body;

    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated - req.user.id is undefined'
      });
    }

    // Fetch user from DB using ID
    const user = await User.findById(req.user.id).select('userName email');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found in database'
      });
    }

    const updatedBy = user.userName || user.email || req.user.id;

    // Validate required fields
    if (!ticketRequestId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ticketRequestId and status are required'
      });
    }

    // Create new ticket request status
    const ticketRequestStatus = new TicketRequestStatus({
      ticketRequest,
      status,
      paymentMethod,
      remark,
      updatedBy
    });

    await ticketRequestStatus.save();

    // Update the original ticket request status
    await TicketRequest.findByIdAndUpdate(ticketRequestId, { status });

    res.status(201).json({
      success: true,
      message: 'Ticket request status updated successfully',
      data: ticketRequestStatus
    });
  } catch (error) {
    console.error('Error creating ticket request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ticket request status',
      error: error.message
    });
  }
};

const getAllTicketRequestStatuses = async (req, res) => {
  try {
    const statuses = await TicketRequestStatus.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: statuses
    });
  } catch (error) {
    console.error('Error fetching ticket request statuses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ticket request statuses',
      error: error.message
    });
  }
};


const deleteTicketRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("id.....", id)

    const deleted = await TicketRequestStatus.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Ticket request status not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket request status deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ticket request status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


module.exports = {
  createTicketRequestStatus,
  getAllTicketRequestStatuses,
  deleteTicketRequestStatus
};