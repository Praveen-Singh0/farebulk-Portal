const express = require('express');
const router = express.Router();
const { createStripePaymentIntent, handleStripeWebhook, handleCheckoutSuccess } = require('../controllers/stripePaymentController');
const verifyUser = require('../middleware/verifyUser');

// Webhook endpoint (no authentication required)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.use(verifyUser);

// Create payment intent
router.post('/create-payment-intent', createStripePaymentIntent);

// Handle checkout success
router.get('/checkout-success', handleCheckoutSuccess);

module.exports = router;