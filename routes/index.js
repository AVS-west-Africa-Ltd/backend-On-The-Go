const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const profileRoutes = require("./profile.routes");
const appRoutes = require("./app.routes");
const communityRoutes = require("./community.routes");

// Mount routes with versioning
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/app", appRoutes);
router.use("/community", communityRoutes);

module.exports = router;
