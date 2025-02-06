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
const { catchErrors } = require("../handlers/errorHandler");

router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);

// User routes
router.post("/register", catchErrors(UserController.CreateUser));
router.post("/login", UserController.Login);
router.get("/users", catchErrors(UserController.getUsers));
router.get("/user/:userId", catchErrors(UserController.getUserById));
router.delete("/delete/user/:userId", catchErrors(UserController.deleteUser));
router.put("/update/user/:userId", catchErrors(UserController.updateUser));
router.put("/update/userimage/:userId", catchErrors(UserController.UpdateUserImage)); // Update profile image
router.post("/:userId/follow/:followerId", catchErrors(UserController.addFollower));
router.delete("/:userId/unfollow/:followerId", catchErrors(UserController.removeFollower));
router.get("/notifications/:userId", catchErrors(UserController.getNotifications));
router.patch(
  "/notifications/:notificationId/read",
    catchErrors(UserController.markNotificationAsRead)
);
router.get("/:userId/followers", catchErrors(UserController.getUserWithFollowers));
router.post("/:userId/interests", catchErrors(UserController.addInterests));
router.put("/:userId/interests/:index", catchErrors(UserController.updateInterest));
router.delete("/:userId/interests/:index", catchErrors(UserController.deleteInterest));

// Post routes
router.post("/user/post", catchErrors(PostController.createPost));
router.get("/user/post/:postId", catchErrors(PostController.getPostById));
router.get("/posts/user", catchErrors(PostController.getPosts));
router.put("/update/post/:postId", catchErrors(PostController.updatePost));
router.delete("/delete/post/:postId", catchErrors(PostController.deletePost));
router.post("/:userId/likes/:postId", catchErrors(PostController.toggleLike));
router.post("/:postId/rating", catchErrors(PostController.ratePost));
router.post("/:userId/bookmark/:postId", catchErrors(PostController.bookmarkPost));
router.get("/users/:userId/bookmarks", catchErrors(PostController.getBookmarkedPosts));

// Comments routes
router.post("/posts/:postId/comments", catchErrors(CommentController.createComment));
router.get("/posts/:postId/comments", catchErrors(CommentController.getComments));
router.delete(
  "/posts/:postId/comments/:commentId/:userId",
    catchErrors(CommentController.deleteComment)
);

// Business Profile
router.post("/register-business", catchErrors(businessController.createBusiness));
router.get("/businesses/:id", catchErrors(businessController.getBusinessById));
router.get("/businesses", catchErrors(businessController.getAllBusinesses));
router.get("/business/:userId/user", catchErrors(businessController.getUserBusinesses));
router.put("/businesses/:id", catchErrors(businessController.updateBusiness));
router.delete("/businesses/:id", catchErrors(businessController.deleteBusiness));
router.get(
  "/businesses/:businessId/posts",
    catchErrors(businessController.getBusinessPosts)
);

// Business Posts
router.post("/bussiness/post", catchErrors(businessPostsController.createPost));
router.get("/bussiness/posts", catchErrors(businessPostsController.getAllPosts));
router.get("/posts/:id", catchErrors(businessPostsController.getPostById));
router.put("/posts/:id", catchErrors(businessPostsController.updatePost));
router.put("/like/:id", catchErrors(businessPostsController.toggleLike));
router.delete("/posts/:id", catchErrors(businessPostsController.deletePost));

router.get(
  "/posts/:businessId/posts",
    catchErrors(businessPostsController.getBusinessPosts)
);

// Get Images
router.get("/uploads/:id", getImage);

module.exports = router;
