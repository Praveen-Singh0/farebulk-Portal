const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');




const ticketRequestRoutes = require('./routes/ticketRequest');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/ticket-requests', ticketRequestRoutes);
app.use('/api/items', itemRoutes);




// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
});

module.exports = app;
