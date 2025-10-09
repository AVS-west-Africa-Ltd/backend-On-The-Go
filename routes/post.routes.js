const express = require("express");
const router = express.Router();

const Upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);



module.exports = router;