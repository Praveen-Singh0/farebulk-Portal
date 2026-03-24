const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const { lookupCallerId } = require('../controllers/callerIdController');

// Caller ID lookup by phone number
router.get('/lookup/:phone', verifyUser, lookupCallerId);

module.exports = router;
