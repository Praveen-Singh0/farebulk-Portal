const express = require('express');
const router = express.Router();
const { login, createUser, logout, getAllUsers, deleteUser } = require('../controllers/authController');

router.post('/register', createUser);
router.post('/login', login);
router.post('/logout', logout);
router.get('/getUser', getAllUsers);

router.delete('/users/:id', deleteUser); // DELETE user by ID



// router.get('/verify', verifyUser);




module.exports = router;
