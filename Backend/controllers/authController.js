const { User } = require('../models/User.js');
const { ActivityLog } = require('../models/ActivityLog');
const jwt = require('jsonwebtoken');
const { autoLoginPhone, getExtensionStatus } = require('../services/phoneAutoLogin');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, ACCESS_TOKEN_SECRET, { 
    expiresIn: '1d',
  });
}; 

// User Login
const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("email...", email)
  console.log("password.....", password)

  try {
    const user = await User.findOne({ email });

    console.log("user......", user)

    if (!user) return res.status(401).json({ message: 'User does not exist' });

    if (!(await user.comparePassword(password))) {
      console.log("Invalid credentials")
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const accessToken = generateAccessToken(user._id);

    console.log("login token :", accessToken)

    // Send accessToken in httpOnly cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // Log login activity
    try {
      await ActivityLog.create({
        userName: user.userName,
        email: user.email,
        role: user.role,
        action: 'login',
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '',
      });
    } catch (logErr) {
      console.error('Failed to log login activity:', logErr);
    }

    // Auto-login phone if extension is configured
    let phoneLoginResult = null;
    if (user.phoneExtension) {
      try {
        const username = user.phoneExtension; // e.g., "101"
        const password = `Farebulk@${user.phoneExtension}!`; // Password format: Farebulk@101!
        
        phoneLoginResult = await autoLoginPhone(user.phoneExtension, username, password);
        console.log('[Login] Phone auto-login successful for extension:', user.phoneExtension);
      } catch (phoneErr) {
        console.error('[Login] Phone auto-login failed for extension:', user.phoneExtension, phoneErr.message);
        // Don't fail the login if phone registration fails - user can still use CRM
      }
    } else {
      console.log('[Login] No phone extension configured for user:', email);
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        userName: user.userName,
        phoneExtension: user.phoneExtension
      },
      phoneLogin: phoneLoginResult
    });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

const logout = async (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  });

  res.json({ message: 'Logout successful' });
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params; 

  try {
    const deletedUser = await User.findByIdAndDelete(id); 
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' }); 
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
}; 

// User Registration
const createUser = async (req, res) => {
  const { email, password, userName, role, phoneExtension } = req.body;

  console.log("====", email, "_", password, "_", role, "_", userName, "_", phoneExtension)

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const newUser = await User.create({
      email,
      password,
      role,
      userName,
      phoneExtension // Add phone extension to new user
    }); 

    console.log("newUser : ", newUser)

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        userName: newUser.userName,
        phoneExtension: newUser.phoneExtension
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Assign or update phone extension for a user
const assignPhoneExtension = async (req, res) => {
  try {
    const { userId, phoneExtension } = req.body;
    
    if (!userId || !phoneExtension) {
      return res.status(400).json({ message: 'userId and phoneExtension are required' });
    }

    // Validate extension format (should be 3 digits)
    if (!/^\d{3}$/.test(phoneExtension)) {
      return res.status(400).json({ message: 'Phone extension must be 3 digits (e.g., 101)' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { phoneExtension },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[assignPhoneExtension] User ${user.email} assigned extension ${phoneExtension}`);

    return res.status(200).json({
      message: 'Phone extension assigned successfully',
      user: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        phoneExtension: user.phoneExtension
      }
    });
  } catch (error) {
    console.error('Error assigning phone extension:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get phone status for a user
const getUserPhoneStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.phoneExtension) {
      return res.status(200).json({
        message: 'No phone extension assigned',
        user: user.email,
        phoneExtension: null,
        status: 'not_assigned'
      });
    }

    // Check extension status
    const extStatus = await getExtensionStatus(user.phoneExtension);

    return res.status(200).json({
      message: 'Phone status retrieved',
      user: user.email,
      phoneExtension: user.phoneExtension,
      status: extStatus.isRegistered ? 'registered' : 'not_registered',
      isRegistered: extStatus.isRegistered
    });
  } catch (error) {
    console.error('Error getting phone status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { login, createUser, logout, getAllUsers, deleteUser, assignPhoneExtension, getUserPhoneStatus };
