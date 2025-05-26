// middleware/verifyUser.js
const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;


const verifyUser = (req, res, next) => {

  const token = req.cookies.accessToken;

  // console.log("varify token here : ", token)
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden - Invalid token' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = verifyUser;
