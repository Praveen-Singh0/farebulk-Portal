const express = require('express');
const router = express.Router();
const verifyUser = require('../middleware/verifyUser');
const { 
  getAuthRecords, 
  getAuthRecord, 
  getAuthStats, 
  downloadPdf,
  createAuthRecord,
  updateAuthRecord 
} = require('../controllers/authRecordController');

// Protected routes (CRM dashboard users)
router.get('/', verifyUser, getAuthRecords);
router.get('/stats', verifyUser, getAuthStats);
router.get('/:id', verifyUser, getAuthRecord);
router.get('/:id/pdf', verifyUser, downloadPdf);

// Internal API routes (called from Auth Form backend - no auth needed)
router.post('/internal/create', createAuthRecord);
router.put('/internal/update/:token', updateAuthRecord);

module.exports = router;
