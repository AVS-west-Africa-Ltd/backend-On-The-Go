const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

const jwtUtil = {
  generateToken: (user) => jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' }),
  
  verifyToken: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
};

module.exports = jwtUtil;
