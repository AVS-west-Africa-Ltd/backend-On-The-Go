// routes/index.js
const express = require('express');
const multer = require('multer');
const zoneBusinessController = require('../controllers/zoneBusinessController');
const log = require('../utils/logger');

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Login route
router.post('/login', zoneBusinessController.login);

// File upload route
router.post('/upload', upload.array('files'), zoneBusinessController.uploadFiles);

// Register business route
router.post('/register/:id', zoneBusinessController.registerBusiness);

// Unregister business route
router.post('/unregister/:id', zoneBusinessController.unregisterBusiness);

// Get businesses route
router.get('/businesses', zoneBusinessController.getBusinesses);

// Verify business route
router.post('/verify/:id', zoneBusinessController.verifyBusiness);

// Get logs route
router.get('/logs', zoneBusinessController.getLogs);

module.exports = router;