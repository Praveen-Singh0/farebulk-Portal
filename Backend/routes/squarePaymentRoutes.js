const express = require('express');
const router = express.Router();
const { createSquarePayment } = require('../controllers/squarePaymentController');
const verifyUser = require('../middleware/verifyUser');

// All routes require authentication
router.use(verifyUser);

// POST /api/square/create-payment
router.post('/create-payment', createSquarePayment);

module.exports = router;
