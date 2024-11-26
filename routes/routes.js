const express = require("express");
const router = express.Router();
const businessController = require("../controllers/BusinessController");
const authMiddleware = require("../middlewares/authMiddleware");
const businessPostsController = require("../controllers/BusinessPostsController");
const getImage = require("../controllers/getImage");

// Business Profile
router.post("/businesses", businessController.createBusiness);
router.get("/businesses/:id", businessController.getBusinessById);
router.get("/businesses", businessController.getAllBusinesses);
router.put("/businesses/:id", businessController.updateBusiness);
router.delete("/businesses/:id", businessController.deleteBusiness);
router.get(
  "/businesses/:businessId/posts",
  businessController.getBusinessPosts
);

// Business Posts
router.post("/posts", businessPostsController.createPost);
router.get("/posts", businessPostsController.getAllPosts);
router.get("/posts/:id", businessPostsController.getPostById);
router.put("/posts/:id", businessPostsController.updatePost);
router.put("/like/:id", businessPostsController.toggleLike);
router.delete("/posts/:id", businessPostsController.deletePost);

router.get(
  "/posts/:businessId/posts",
  businessPostsController.getBusinessPosts
);

// Get Images
router.get("/images/:id", getImage);

module.exports = router;
