const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const { User } = require('./models/User.js')

const verifyUser = require('./middleware/verifyUser');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');

const ticketRequestRoutes = require('./routes/ticketRequest');

const app = express();

app.use(cookieParser());

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ticket-requests', ticketRequestRoutes);
app.use('/api/items', itemRoutes);

app.get('/api/dashboard', verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('email role userName');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      authenticated: true,
      user: {
        email: user.email,
        role: user.role,
        userName: user.userName,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));


module.exports = app;
