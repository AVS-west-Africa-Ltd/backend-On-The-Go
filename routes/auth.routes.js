// routes/index.js
const express = require('express');
const authController = require('../controllers/AuthController');
const router = express.Router();

// Error handling wrapper
const catchErrors = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


router.post("/register", authController.register);
router.post("/login", authController.login);

router.post("/verify-email", authController.verifyEmail);
router.post("/send-code", authController.sendCode);

router.post("/reset-password", authController.resetPassword);



module.exports = router;