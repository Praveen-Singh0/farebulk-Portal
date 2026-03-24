const express = require('express');
const router = express.Router();
const {
  getLiveCalls,
  getRingStrategy,
  updateRingStrategy,
  bargeCall,
  getExtensionStatus,
  getQueueStatus,
  addQueueMember,
  removeQueueMember,
  pauseQueueMember,
} = require('../controllers/callDashboardController');
const { protect } = require('../middleware/authMiddleware');

// Live calls
router.get('/live-calls', protect, getLiveCalls);

// Ring strategy
router.get('/ring-strategy', protect, getRingStrategy);
router.put('/ring-strategy', protect, updateRingStrategy);

// Barge
router.post('/barge', protect, bargeCall);

// Extension status
router.get('/extension-status', protect, getExtensionStatus);

// Queue management
router.get('/queue/status', protect, getQueueStatus);
router.post('/queue/add-member', protect, addQueueMember);
router.post('/queue/remove-member', protect, removeQueueMember);
router.post('/queue/pause-member', protect, pauseQueueMember);

module.exports = router;
