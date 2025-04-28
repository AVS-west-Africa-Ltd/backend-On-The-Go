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
const ProfileViewController = require("../controllers/ProfleViewController");
const processBusinessController = require("../cron/populate-business");
const PushNotificationController = require("../controllers/PushNotificationController");
const VoucherController = require("../controllers/VoucherController");


router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);

// User routes
router.post("/register", catchErrors(UserController.CreateUser));
router.post("/login", UserController.Login);
router.get("/users", catchErrors(UserController.getUsers));
router.get("/user/:userId", catchErrors(UserController.getUserById));
router.delete("/delete/user/:userId", catchErrors(UserController.deleteUser));
router.put("/update/user/:userId", catchErrors(UserController.updateUser));
router.put(
  "/update/userimage/:userId",
  catchErrors(UserController.UpdateUserImage)
); // Update profile image
router.post(
  "/:userId/follow/:followedId",
  catchErrors(UserController.addFollower)
);
router.delete(
  "/:userId/unfollow/:followedId",
  catchErrors(UserController.removeFollower)
);
router.get("/my-followers/:userId", catchErrors(UserController.getFollowers));
router.get(
  "/users-following-me/:userId",
  catchErrors(UserController.getFollowing)
);
router.get(
  "/notifications/:userId",
  catchErrors(UserController.getNotifications)
);
router.patch(
  "/notifications/:notificationId/:userId/read",
  catchErrors(UserController.markNotificationAsRead)
);
router.put(
  "/mark-all-as-read/:userId",
  catchErrors(UserController.markAllNotificationsAsRead)
);
// router.get("/:userId/followers", catchErrors(UserController.getUserWithFollowers));
router.post("/:userId/interests", catchErrors(UserController.addInterests));
router.put(
  "/:userId/interests/:index",
  catchErrors(UserController.updateInterest)
);
router.delete(
  "/:userId/interests/:index",
  catchErrors(UserController.deleteInterest)
);
router.post("/forgot-password", catchErrors(UserController.ForgotPassword));
router.get(
  "/confirm-password-otp/:otp",
  catchErrors(UserController.confirmPasswordOTP)
);
router.put("/reset-password/:otp", catchErrors(UserController.ResetPassword));
router.post(
  "/request-delete",
  catchErrors(UserController.UserAccountDeleteRequest)
);
router.post(
  "/approve-delete/:requestId",
  catchErrors(UserController.ApproveUserDeletionRequest)
);
router.post(
  "/deny-delete/:requestId",
  catchErrors(UserController.DenyUserDeletionRequest)
);
router.get("/random-users", catchErrors(UserController.GetRandomUsers));

// Wifi Scanner routes
router.post(
  "/add-wifi-scanner/:businessId",
  catchErrors(businessController.addWifiScanner)
);
router.get(
  "/get-all-wifi-scan/:businessId",
  catchErrors(businessController.getAllWifiScan)
);
router.get(
  "/get-repeated-customers/:businessId",
  catchErrors(businessController.getAllRepeatedCustomers)
);

// Post routes
router.post("/user/post", catchErrors(PostController.createPost));
router.get("/user/post/:postId", catchErrors(PostController.getPostById));
router.get("/posts/user/:userId/:postType", catchErrors(PostController.GetPostsByUserId));
router.put("/user/:userId/push-token", catchErrors(UserController.updatePushToken));
router.get("/posts/user", catchErrors(PostController.getPosts));
router.put("/update/post/:postId", catchErrors(PostController.updatePost));
router.delete("/delete/post/:postId", catchErrors(PostController.deletePost));
router.post("/:userId/likes/:postId", catchErrors(PostController.toggleLike));
router.post("/:postId/rating", catchErrors(PostController.ratePost));
router.get("/posts/statistics/:userId",catchErrors(PostController.getPostStatistics));


router.post(
  "/:userId/bookmark/:postId",
  catchErrors(PostController.bookmarkPost)
);
router.get(
  "/users/:userId/bookmarks",
  catchErrors(PostController.getBookmarkedPosts)
);

// Comments routes
router.post(
  "/posts/:postId/comments",
  catchErrors(CommentController.createComment)
);
router.get(
  "/posts/:postId/comments",
  catchErrors(CommentController.getComments)
);
router.delete(
  "/posts/:postId/comments/:commentId/:userId",
  catchErrors(CommentController.deleteComment)
);

// Track profile views
router.get(
  "/profile/:profileOwnerId/view/:viewerId",
  catchErrors(ProfileViewController.viewProfile)
);

// Get profile views count
router.get(
  "/profile/views/:profileOwnerId",
  catchErrors(ProfileViewController.getProfileViews)
);

// Get profile viewers list
router.get(
  "/profile/viewers/:profileOwnerId",
  catchErrors(ProfileViewController.getProfileViewers)
);

// Business Profile

router.post("/register-business", businessController.createBusiness);
// router.post("/business/toggle-follow", businessController.toggleFollow);
router.get("/businesses/:userId", businessController.getBusinessByUserId);
router.get("/business/:businessId", businessController.getBusinessById);
router.get("/businesses", businessController.getAllBusinesses);
router.get("/business", businessController.getAllBusiness);
// router.get("/business/:userId/user", businessController.getUserBusinesses);
// router.get("/business/:businessId/following", businessController.getFollowing);
router.put("/businesses/:id", businessController.updateBusiness);
// router.delete("/businesses/:id", businessController.deleteBusiness);

// router.post("/register-business", catchErrors(businessController.createBusiness));
// router.get("/businesses/:id", catchErrors(businessController.getBusinessById));
// router.get("/businesses", catchErrors(businessController.getAllBusinesses));
// router.get("/business/:userId/user", catchErrors(businessController.getUserBusinesses));
// router.put("/businesses/:id", catchErrors(businessController.updateBusiness));
// router.delete("/businesses/:id", catchErrors(businessController.deleteBusiness));

router.get(
  "/businesses/:businessId/posts",
  catchErrors(businessController.getBusinessPosts)
);

// Business Posts
router.post("/bussiness/post", catchErrors(businessPostsController.createPost));
router.get(
  "/bussiness/posts",
  catchErrors(businessPostsController.getAllPosts)
);
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

router.get("/business/filters", businessController.filterBusinesses);
router.get("/search/business", businessController.searchBusinessesByName);

router.get("/process-businesses", processBusinessController.processBusinesses);

// Push Notification routes
router.post("/send-notification", catchErrors(PushNotificationController.sendNotificationToAllUsers)
);


// Voucher routes
router.post("/vouchers", authMiddleware, catchErrors(VoucherController.createVoucher));
router.post("/vouchers/:voucherId/claim", authMiddleware, catchErrors(VoucherController.claimVoucher));
router.post("/vouchers/use/:userVoucherId", authMiddleware, catchErrors(VoucherController.useVoucher));
router.post("/vouchers/:voucherId/gift", authMiddleware, catchErrors(VoucherController.giftVoucher));
router.post("/vouchers/:voucherId/request-exchange", authMiddleware, catchErrors(VoucherController.requestExchange));
router.post("/vouchers/:requestId/respond-exchange", authMiddleware, catchErrors(VoucherController.respondToExchange));
router.get("/users/:userId/vouchers", authMiddleware, catchErrors(VoucherController.getAllUserVouchers));
router.get("/vouchers/exchange-requests/all", authMiddleware, catchErrors(VoucherController.getAllPendingExchangeRequests));
router.get("/vouchers/business-stats", authMiddleware, catchErrors(VoucherController.getBusinessVoucherStats));
router.post("/vouchers/:voucherId/send-to-market", authMiddleware,catchErrors(VoucherController.sendToMarket));


module.exports = router;
