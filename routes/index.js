const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const profileRoutes = require("./profile.routes");

// Mount routes with versioning
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
