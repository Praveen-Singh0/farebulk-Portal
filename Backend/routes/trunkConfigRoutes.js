// routes/trunkConfigRoutes.js
const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const trunkConfigController = require('../controllers/trunkConfigController');

// GET /api/trunk/config — read current trunk username/password + status
router.get('/config', verifyUser, trunkConfigController.getTrunkConfig);

// PUT /api/trunk/config — update trunk username/password, reload Asterisk
router.put('/config', verifyUser, trunkConfigController.updateTrunkConfig);

module.exports = router;
