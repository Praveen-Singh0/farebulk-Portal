express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const { 
  createTicketRequestStatus, 
  getAllTicketRequestStatuses 
} = require('../controllers/ticketRequestStatusController');

// POST /api/ticket-requests-status/ - Create new ticket request status
router.post('/', verifyUser, createTicketRequestStatus);

// GET /api/ticket-requests-status/ - Get all ticket request statuses
router.get('/', getAllTicketRequestStatuses);

module.exports = router;