const User = require('../../models/Initials/User');
const bcryptUtil = require('../../utils/bcryptUtil');
const jwtUtil = require('../../utils/jwtUtil');

const authController = {
  register: async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcryptUtil.hashPassword(password);

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    await User.create(username, email, hashedPassword);
    res.status(201).json({ message: 'User registered successfully' });
  },
  
  login: async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user || !bcryptUtil.comparePasswords(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwtUtil.generateToken(user);
    res.json({ token });
  },
};

module.exports = authController;
