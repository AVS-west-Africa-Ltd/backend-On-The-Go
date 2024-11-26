const express = require("express");
const chatRoutes = require("./chatRoutes");
const authRoutes = require("./Initials/authRoutes");
const router = express.Router();

router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);

module.exports = router;
