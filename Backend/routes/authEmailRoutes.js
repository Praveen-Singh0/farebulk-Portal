const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const { sendAuthEmail } = require('../controllers/authEmailController');

// POST /api/auth-email/send - Send authorization email to customer
router.post('/send', verifyUser, sendAuthEmail);

module.exports = router;
