const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route for creating a user profile
router.post('/create', authMiddleware, profileController.createProfile);

// Route for fetching a user's profile
router.get('/', authMiddleware, profileController.getProfile);

module.exports = router;
