// routes/callDescriptionRoutes.js
const express = require('express');
const router = express.Router();
const {
  createCallDescription,
  getAllCallDescriptions,
  getCallDescriptionById,
  updateCallDescription,
  deleteCallDescription
} = require('../controllers/callDescriptionController');

// Routes
router.post('/callDescription', createCallDescription);
router.get('/call-descriptions', getAllCallDescriptions);
router.get('/call-descriptions/:id', getCallDescriptionById);
router.put('/call-descriptions/:id', updateCallDescription);
router.delete('/call-descriptions/:id', deleteCallDescription);

module.exports = router;
