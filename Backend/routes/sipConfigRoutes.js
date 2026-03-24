const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const {
  getMySipConfig,
  getAllSipConfigs,
  upsertSipConfig,
  deleteSipConfig,
  getGlobalDefaults,
} = require('../controllers/sipConfigController');

// Agent: get own SIP config
router.get('/my-config', verifyUser, getMySipConfig);

// Admin: manage all SIP configs
router.get('/all', verifyUser, getAllSipConfigs);
router.post('/upsert', verifyUser, upsertSipConfig);
router.delete('/:id', verifyUser, deleteSipConfig);
router.get('/defaults', verifyUser, getGlobalDefaults);

module.exports = router;
