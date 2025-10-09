const express = require("express");
const router = express.Router();
const appController = require("../controllers/AppController");
const Upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.post("/create-post", Upload.array("media", 5), appController.createPost);
router.get("/fetch-posts", appController.fetchPosts);
router.get("/fetch-profiles", appController.searchProfiles);
router.post("/make-comment", appController.makeComment);
router.post("/toggle-reaction", appController.toggleReaction);
router.post("/follow-profile", appController.followProfile);


module.exports = router;