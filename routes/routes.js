const express = require("express");
const chatRoutes = require("./chatRoutes");
const authRoutes = require("./Initials/authRoutes");
const router = express.Router();
const UserController = require("../controllers/UserController");
const PostController = require("../controllers/PostController");
const CommentController = require("../controllers/CommentController");
const businessController = require("../controllers/BusinessController");
const authMiddleware = require("../middlewares/authMiddleware");
const businessPostsController = require("../controllers/BusinessPostsController");
const getImage = require("../controllers/getImage");
const upload = require("../utils/multerSetup");

router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);

// User routes
router.post("/register", UserController.CreateUser);
router.post("/login", UserController.Login);
router.get("/users", UserController.getUsers);
router.get("/user/:userId", UserController.getUserById);
router.delete("/delete/user/:userId", UserController.deleteUser);
router.put("/update/user/:userId", UserController.updateUser);
router.put("/update/userimage/:userId", UserController.UpdateUserImage); // Update profile image
router.post("/:userId/follow/:followerId", UserController.addFollower);
router.delete("/:userId/unfollow/:followerId", UserController.removeFollower);
router.get("/notifications/:userId", UserController.getNotifications);
router.patch(
  "/notifications/:notificationId/read",
  UserController.markNotificationAsRead
);
router.get("/:userId/followers", UserController.getUserWithFollowers);
router.post("/:userId/interests", UserController.addInterests);
router.put("/:userId/interests/:index", UserController.updateInterest);
router.delete("/:userId/interests/:index", UserController.deleteInterest);

// Post routes
router.post("/user/post", PostController.createPost);
router.get("/user/post/:postId", PostController.getPostById);
router.get("/posts/user", PostController.getPosts);
router.put("/update/post/:postId", PostController.updatePost);
router.delete("/delete/post/:postId", PostController.deletePost);
router.post("/:userId/likes/:postId", PostController.toggleLike);
router.post("/:postId/rating", PostController.ratePost);
router.post("/:userId/bookmark/:postId", PostController.bookmarkPost);
router.get("/users/:userId/bookmarks", PostController.getBookmarkedPosts);

// Comments routes
router.post("/posts/:postId/comments", CommentController.createComment);
router.get("/posts/:postId/comments", CommentController.getComments);
router.delete(
  "/posts/:postId/comments/:commentId/:userId",
  CommentController.deleteComment
);

// Business Profile
router.post("/register-business", businessController.createBusiness);
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
router.get("/uploads/:id", getImage);

module.exports = router;
