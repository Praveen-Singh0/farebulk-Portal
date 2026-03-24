const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const {
  logActivity,
  getUserStatuses,
  getActivityLogs,
  getUserTimeline,
} = require('../controllers/activityLogController');

// All routes require authentication
router.post('/log', verifyUser, logActivity);
router.get('/statuses', verifyUser, getUserStatuses);
router.get('/logs', verifyUser, getActivityLogs);
router.get('/timeline/:userName', verifyUser, getUserTimeline);

module.exports = router;
