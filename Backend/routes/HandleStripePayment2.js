const express = require('express');
const router = express.Router();
const { 
  createStripePaymentIntent2,  
} = require('../controllers/stripePaymentController2');
const verifyUser = require('../middleware/verifyUser');

// Protected routes 
router.use(verifyUser);
router.post('/create-payment-intent', createStripePaymentIntent2);

module.exports = router;
