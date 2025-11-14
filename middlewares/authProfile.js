const jwtUtil = require('../utils/jwtUtil');

const authProfile = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Sorry no token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwtUtil.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Sorry invalid or expired token' });
  }
  
  req.user = decoded.user;

  if(!decoded.profile || decoded.profile == null){
    return res.status(400).json({ message: "Sorry select a profile!"});
  }
  req.profile = decoded.profile;
  next();
};
module.exports = authProfile;

