const express = require('express');
const router = express.Router();
const { 
  createStripePaymentIntent,  
} = require('../controllers/stripePaymentController');
const verifyUser = require('../middleware/verifyUser');


// Protected routes 
router.use(verifyUser);
router.post('/create-payment-intent', createStripePaymentIntent);

module.exports = router;