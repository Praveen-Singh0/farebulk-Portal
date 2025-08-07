const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config();

const { User } = require('./models/User.js')

const verifyUser = require('./middleware/verifyUser');
const itemRoutes = require('./routes/itemRoutes');
const authRoutes = require('./routes/authRoutes');

const ticketRequestRoutes = require('./routes/ticketRequest');
const ticketRequestStatusRoutes = require('./routes/ticketRequestStatusRoutes');
const HandleAuthUSPayment = require('./routes/HandleAuthUSPayment');
const HandleStripePayment = require('./routes/HandleStripePayment');
const multiSiteCrmRoutes = require('./routes/multiSiteCrm');


const app = express();

app.use(cookieParser()); 

const corsOptions = {
  origin: process.env.CORS_DOMAIN,       
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.get('/', (req, res) => { 
  res.send('API is running 🚀');
});

   
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ticket-requests', ticketRequestRoutes);
app.use('/api/ticket-requests-status', ticketRequestStatusRoutes);
app.use('/api/ticket-requests-AuthrizeUS', HandleAuthUSPayment);
app.use('/api/stripe', HandleStripePayment); 
app.use('/api/items', itemRoutes);
app.use('/api', multiSiteCrmRoutes);

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
