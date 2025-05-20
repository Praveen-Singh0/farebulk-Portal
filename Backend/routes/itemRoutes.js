const express = require('express');

const { saveItem } = require('../controllers/itemController');

const router = express.Router();

// Define the POST route
router.post('/save', saveItem);

module.exports = router;
