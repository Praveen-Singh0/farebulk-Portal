const TicketRequest = require('../models/TicketRequest');
const { sendAuthorizationEmail } = require('../utils/emailService');

/**
 * Send Authorization Email to customer
 * POST /api/auth-email/send
 * Body: { ticketRequestId, agentName }
 */
const sendAuthEmail = async (req, res) => {
  try {
    const { ticketRequestId, agentName } = req.body;

    if (!ticketRequestId) {
      return res.status(400).json({ success: false, message: 'ticketRequestId is required.' });
    }

    // Find the ticket
    const ticket = await TicketRequest.findById(ticketRequestId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket request not found.' });
    }

    // Check if customer email exists
    const customerEmail = ticket.passengerEmail || ticket.billingEmail;
    if (!customerEmail) {
      return res.status(400).json({ success: false, message: 'No customer email found on this ticket.' });
    }

    // Send the authorization email
    const result = await sendAuthorizationEmail(ticket, agentName || 'Booking Desk');

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        sentTo: customerEmail,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Error in sendAuthEmail controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while sending authorization email.',
    });
  }
};

module.exports = { sendAuthEmail };
