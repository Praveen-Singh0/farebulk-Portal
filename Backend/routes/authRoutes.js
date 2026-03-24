const express = require('express');
const router = express.Router();
const { login, createUser, logout, getAllUsers, deleteUser, assignPhoneExtension, getUserPhoneStatus } = require('../controllers/authController');

router.post('/register', createUser);
router.post('/login', login);
router.post('/logout', logout);
router.get('/getUser', getAllUsers);
router.delete('/users/:id', deleteUser);

// Phone extension management
router.post('/assign-extension', assignPhoneExtension); // Assign phone extension to user
router.get('/phone-status/:userId', getUserPhoneStatus); // Check phone status for user

module.exports = router;
