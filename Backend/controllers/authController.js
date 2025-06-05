const { User } = require('../models/User.js');
const jwt = require('jsonwebtoken');


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;


const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, ACCESS_TOKEN_SECRET, { 
    expiresIn: '1d',
  });
}; 


// User Login
const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("eeeeee", email)

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
      secure: process.env.NODE_ENV === 'production', // send only on HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        email: user.email,
        role: user.role,
        userName: user.userName
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

const logout = async (req, res)=>{

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
  const { email, password, userName, role } = req.body;

  console.log("====", email, "_", password, "_", role, "_", userName)

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
      userName
    }); 

    console.log("newUser : ", newUser)

    return res.status(201).json({
      message: 'User created successfully',
      user:
      {
        email: newUser.email,
        role: newUser.role,
        userName: newUser.userName
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};


module.exports = { login, createUser, logout, getAllUsers, deleteUser };
