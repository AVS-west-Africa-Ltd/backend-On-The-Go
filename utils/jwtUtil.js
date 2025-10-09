const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

exports.generateToken = (user) => jwt.sign(user, JWT_SECRET,  { expiresIn: '65d' });

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}


