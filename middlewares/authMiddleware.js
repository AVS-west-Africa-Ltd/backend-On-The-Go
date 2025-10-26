const jwtUtil = require('../utils/jwtUtil');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwtUtil.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  req.user = decoded.user;
  if(!req.profile){
    return res.status(400).json({ message: "Sorry select a profile!"});
  }
  req.profile = decoded.profile;
  next();
};

module.exports = authMiddleware;
