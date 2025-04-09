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

router.get("/business/filters", businessController.filterBusinesses);

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and registration
 *   - name: Users
 *     description: User management operations
 *   - name: Posts
 *     description: User post operations
 *   - name: Comments
 *     description: Post comment operations
 *   - name: Business
 *     description: Business operations
 *   - name: Business Posts
 *     description: Business post operations
 *   - name: Profile
 *     description: Profile viewing analytics
 *   - name: Wifi
 *     description: Wifi scanner operations
 *   - name: Media
 *     description: Media file operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         username:
 *           type: string
 *           example: "john_doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 *         profileImage:
 *           type: string
 *           example: "uploads/profile.jpg"
 *         bio:
 *           type: string
 *           example: "Software developer"
 *         interests:
 *           type: array
 *           items:
 *             type: string
 *           example: ["coding", "music"]
 *         followers:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012"]
 *         following:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439013"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439021"
 *         content:
 *           type: string
 *           example: "This is a sample post"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439012"]
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         postType:
 *           type: string
 *           example: "public"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439031"
 *         content:
 *           type: string
 *           example: "Great post!"
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         postId:
 *           type: string
 *           example: "507f1f77bcf86cd799439021"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Business:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439041"
 *         name:
 *           type: string
 *           example: "Acme Corp"
 *         description:
 *           type: string
 *           example: "A sample business"
 *         ownerId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         wifiScanners:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WifiScanner'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     WifiScanner:
 *       type: object
 *       properties:
 *         macAddress:
 *           type: string
 *           example: "00:1A:2B:3C:4D:5E"
 *         signalStrength:
 *           type: number
 *           example: -65
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439051"
 *         type:
 *           type: string
 *           example: "new_follower"
 *         message:
 *           type: string
 *           example: "John Doe started following you"
 *         isRead:
 *           type: boolean
 *           example: false
 *         userId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     BusinessPost:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439061"
 *         content:
 *           type: string
 *           example: "Business announcement"
 *         businessId:
 *           type: string
 *           example: "507f1f77bcf86cd799439041"
 *         likes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439011"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProfileView:
 *       type: object
 *       properties:
 *         viewerId:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         profileOwnerId:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         viewedAt:
 *           type: string
 *           format: date-time
 *
 *     PasswordReset:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         otp:
 *           type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ==================== Authentication Routes ====================

/**
 * @swagger
 * /register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/register", catchErrors(UserController.CreateUser));

/**
 * @swagger
 * /login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", UserController.Login);

// ==================== User Routes ====================

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get("/users", catchErrors(UserController.getUsers));

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:userId", catchErrors(UserController.getUserById));

/**
 * @swagger
 * /delete/user/{userId}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/delete/user/:userId", catchErrors(UserController.deleteUser));

/**
 * @swagger
 * /update/user/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: Update user information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/update/user/:userId", catchErrors(UserController.updateUser));

/**
 * @swagger
 * /update/userimage/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile image
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: The image file to upload
 *     responses:
 *       200:
 *         description: Image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid file
 *       500:
 *         description: Server error
 */
router.put(
  "/update/userimage/:userId",
  catchErrors(UserController.UpdateUserImage)
);

/**
 * @swagger
 * /{userId}/follow/{followedId}:
 *   post:
 *     tags: [Users]
 *     summary: Follow another user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user who is following
 *       - in: path
 *         name: followedId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user to be followed
 *     responses:
 *       200:
 *         description: Successfully followed user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Already following or invalid request
 *       500:
 *         description: Server error
 */
router.post(
  "/:userId/follow/:followedId",
  catchErrors(UserController.addFollower)
);

/**
 * @swagger
 * /{userId}/unfollow/{followedId}:
 *   delete:
 *     tags: [Users]
 *     summary: Unfollow a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user who is unfollowing
 *       - in: path
 *         name: followedId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user to be unfollowed
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Not following or invalid request
 *       500:
 *         description: Server error
 */
router.delete(
  "/:userId/unfollow/:followedId",
  catchErrors(UserController.removeFollower)
);

/**
 * @swagger
 * /my-followers/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user's followers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of followers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get("/my-followers/:userId", catchErrors(UserController.getFollowers));

/**
 * @swagger
 * /users-following-me/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get users that a user is following
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of followed users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get(
  "/users-following-me/:userId",
  catchErrors(UserController.getFollowing)
);

/**
 * @swagger
 * /notifications/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */
router.get(
  "/notifications/:userId",
  catchErrors(UserController.getNotifications)
);

/**
 * @swagger
 * /notifications/{notificationId}/{userId}/read:
 *   patch:
 *     tags: [Users]
 *     summary: Mark notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: Notification ID
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Server error
 */
router.patch(
  "/notifications/:notificationId/:userId/read",
  catchErrors(UserController.markNotificationAsRead)
);

/**
 * @swagger
 * /mark-all-as-read/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All notifications marked as read"
 *       500:
 *         description: Server error
 */
router.put(
  "/mark-all-as-read/:userId",
  catchErrors(UserController.markAllNotificationsAsRead)
);

/**
 * @swagger
 * /{userId}/interests:
 *   post:
 *     tags: [Users]
 *     summary: Add user interests
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["coding", "music"]
 *     responses:
 *       200:
 *         description: Interests added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.post("/:userId/interests", catchErrors(UserController.addInterests));

/**
 * @swagger
 * /{userId}/interests/{index}:
 *   put:
 *     tags: [Users]
 *     summary: Update a specific interest
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: index
 *         schema:
 *           type: integer
 *         required: true
 *         description: Interest index to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interest:
 *                 type: string
 *                 example: "updated interest"
 *     responses:
 *       200:
 *         description: Interest updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.put(
  "/:userId/interests/:index",
  catchErrors(UserController.updateInterest)
);

/**
 * @swagger
 * /{userId}/interests/{index}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a specific interest
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: index
 *         schema:
 *           type: integer
 *         required: true
 *         description: Interest index to delete
 *     responses:
 *       200:
 *         description: Interest deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.delete(
  "/:userId/interests/:index",
  catchErrors(UserController.deleteInterest)
);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     tags: [Users]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordReset'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", catchErrors(UserController.ForgotPassword));

/**
 * @swagger
 * /confirm-password-otp/{otp}:
 *   get:
 *     tags: [Users]
 *     summary: Confirm password reset OTP
 *     parameters:
 *       - in: path
 *         name: otp
 *         schema:
 *           type: string
 *         required: true
 *         description: One-time password
 *     responses:
 *       200:
 *         description: OTP confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid OTP
 *       500:
 *         description: Server error
 */
router.get(
  "/confirm-password-otp/:otp",
  catchErrors(UserController.confirmPasswordOTP)
);

/**
 * @swagger
 * /reset-password/{otp}:
 *   put:
 *     tags: [Users]
 *     summary: Reset user password
 *     parameters:
 *       - in: path
 *         name: otp
 *         schema:
 *           type: string
 *         required: true
 *         description: One-time password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid OTP or password
 *       500:
 *         description: Server error
 */
router.put("/reset-password/:otp", catchErrors(UserController.ResetPassword));

/**
 * @swagger
 * /request-delete:
 *   post:
 *     tags: [Users]
 *     summary: Request account deletion
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               reason:
 *                 type: string
 *                 example: "No longer need the account"
 *     responses:
 *       200:
 *         description: Deletion request submitted
 *       500:
 *         description: Server error
 */
router.post(
  "/request-delete",
  catchErrors(UserController.UserAccountDeleteRequest)
);

/**
 * @swagger
 * /approve-delete/{requestId}:
 *   post:
 *     tags: [Users]
 *     summary: Approve account deletion request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: Deletion request ID
 *     responses:
 *       200:
 *         description: Account deletion approved
 *       500:
 *         description: Server error
 */
router.post(
  "/approve-delete/:requestId",
  catchErrors(UserController.ApproveUserDeletionRequest)
);

/**
 * @swagger
 * /deny-delete/{requestId}:
 *   post:
 *     tags: [Users]
 *     summary: Deny account deletion request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         schema:
 *           type: string
 *         required: true
 *         description: Deletion request ID
 *     responses:
 *       200:
 *         description: Account deletion denied
 *       500:
 *         description: Server error
 */
router.post(
  "/deny-delete/:requestId",
  catchErrors(UserController.DenyUserDeletionRequest)
);

/**
 * @swagger
 * /random-users:
 *   get:
 *     tags: [Users]
 *     summary: Get random users
 *     responses:
 *       200:
 *         description: List of random users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get("/random-users", catchErrors(UserController.GetRandomUsers));

// ==================== Wifi Scanner Routes ====================

/**
 * @swagger
 * /add-wifi-scanner/{businessId}:
 *   post:
 *     tags: [Wifi]
 *     summary: Add wifi scanner data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WifiScanner'
 *     responses:
 *       200:
 *         description: Wifi scanner data added
 *       500:
 *         description: Server error
 */
router.post(
  "/add-wifi-scanner/:businessId",
  catchErrors(businessController.addWifiScanner)
);

/**
 * @swagger
 * /get-all-wifi-scan/{businessId}:
 *   get:
 *     tags: [Wifi]
 *     summary: Get all wifi scan data for a business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of wifi scan data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WifiScanner'
 *       500:
 *         description: Server error
 */
router.get(
  "/get-all-wifi-scan/:businessId",
  catchErrors(businessController.getAllWifiScan)
);

/**
 * @swagger
 * /get-repeated-customers/{businessId}:
 *   get:
 *     tags: [Wifi]
 *     summary: Get repeated customers for a business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of repeated customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get(
  "/get-repeated-customers/:businessId",
  catchErrors(businessController.getAllRepeatedCustomers)
);

// ==================== Post Routes ====================

/**
 * @swagger
 * /user/post:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/user/post", catchErrors(PostController.createPost));

/**
 * @swagger
 * /user/post/{postId}:
 *   get:
 *     tags: [Posts]
 *     summary: Get a post by ID
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get("/user/post/:postId", catchErrors(PostController.getPostById));

/**
 * @swagger
 * /posts/user/{userId}/{postType}:
 *   get:
 *     tags: [Posts]
 *     summary: Get posts by user ID and type
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: postType
 *         schema:
 *           type: string
 *         required: true
 *         description: Type of posts to filter
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get(
  "/posts/user/:userId/:postType",
  catchErrors(PostController.GetPostsByUserId)
);

/**
 * @swagger
 * /posts/user:
 *   get:
 *     tags: [Posts]
 *     summary: Get all posts
 *     responses:
 *       200:
 *         description: List of all posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get("/posts/user", catchErrors(PostController.getPosts));

/**
 * @swagger
 * /update/post/{postId}:
 *   put:
 *     tags: [Posts]
 *     summary: Update a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Post'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.put("/update/post/:postId", catchErrors(PostController.updatePost));

/**
 * @swagger
 * /delete/post/{postId}:
 *   delete:
 *     tags: [Posts]
 *     summary: Delete a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       500:
 *         description: Server error
 */
router.delete("/delete/post/:postId", catchErrors(PostController.deletePost));

/**
 * @swagger
 * /{userId}/likes/{postId}:
 *   post:
 *     tags: [Posts]
 *     summary: Toggle like on a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID who is liking
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID to like/unlike
 *     responses:
 *       200:
 *         description: Like status toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.post("/:userId/likes/:postId", catchErrors(PostController.toggleLike));

/**
 * @swagger
 * /{postId}/rating:
 *   post:
 *     tags: [Posts]
 *     summary: Rate a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *     responses:
 *       200:
 *         description: Rating submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.post("/:postId/rating", catchErrors(PostController.ratePost));

/**
 * @swagger
 * /{userId}/bookmark/{postId}:
 *   post:
 *     tags: [Posts]
 *     summary: Bookmark a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID to bookmark
 *     responses:
 *       200:
 *         description: Post bookmarked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.post(
  "/:userId/bookmark/:postId",
  catchErrors(PostController.bookmarkPost)
);

/**
 * @swagger
 * /users/{userId}/bookmarks:
 *   get:
 *     tags: [Posts]
 *     summary: Get user's bookmarked posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of bookmarked posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 */
router.get(
  "/users/:userId/bookmarks",
  catchErrors(PostController.getBookmarkedPosts)
);

// ==================== Comments Routes ====================

/**
 * @swagger
 * /posts/{postId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               content:
 *                 type: string
 *                 example: "This is a great post!"
 *     responses:
 *       201:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.post(
  "/posts/:postId/comments",
  catchErrors(CommentController.createComment)
);

/**
 * @swagger
 * /posts/{postId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       500:
 *         description: Server error
 */
router.get(
  "/posts/:postId/comments",
  catchErrors(CommentController.getComments)
);

/**
 * @swagger
 * /posts/{postId}/comments/{commentId}/{userId}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Comment ID
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID (must be comment author)
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Unauthorized to delete
 *       500:
 *         description: Server error
 */
router.delete(
  "/posts/:postId/comments/:commentId/:userId",
  catchErrors(CommentController.deleteComment)
);

// ==================== Profile View Routes ====================

/**
 * @swagger
 * /profile/{profileOwnerId}/view/{viewerId}:
 *   get:
 *     tags: [Profile]
 *     summary: Track profile view
 *     parameters:
 *       - in: path
 *         name: profileOwnerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Profile owner ID
 *       - in: path
 *         name: viewerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Viewer ID
 *     responses:
 *       200:
 *         description: View tracked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileView'
 *       500:
 *         description: Server error
 */
router.get(
  "/profile/:profileOwnerId/view/:viewerId",
  catchErrors(ProfileViewController.viewProfile)
);

/**
 * @swagger
 * /profile/views/{profileOwnerId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get profile views count
 *     parameters:
 *       - in: path
 *         name: profileOwnerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Profile owner ID
 *     responses:
 *       200:
 *         description: Profile views count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 42
 *       500:
 *         description: Server error
 */
router.get(
  "/profile/views/:profileOwnerId",
  catchErrors(ProfileViewController.getProfileViews)
);

/**
 * @swagger
 * /profile/viewers/{profileOwnerId}:
 *   get:
 *     tags: [Profile]
 *     summary: Get profile viewers list
 *     parameters:
 *       - in: path
 *         name: profileOwnerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Profile owner ID
 *     responses:
 *       200:
 *         description: List of profile viewers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Server error
 */
router.get(
  "/profile/viewers/:profileOwnerId",
  catchErrors(ProfileViewController.getProfileViewers)
);

// ==================== Business Routes ====================

/**
 * @swagger
 * /register-business:
 *   post:
 *     tags: [Business]
 *     summary: Register a new business
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       201:
 *         description: Business registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post("/register-business", businessController.createBusiness);

/**
 * @swagger
 * /businesses/{userId}:
 *   get:
 *     tags: [Business]
 *     summary: Get business by user ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Business details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get("/businesses/:userId", businessController.getBusinessById);

/**
 * @swagger
 * /businesses:
 *   get:
 *     tags: [Business]
 *     summary: Get all businesses
 *     responses:
 *       200:
 *         description: List of all businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 *       500:
 *         description: Server error
 */
router.get("/businesses", businessController.getAllBusinesses);

/**
 * @swagger
 * /business/filters:
 *   get:
 *     tags: [Business]
 *     summary: Filter businesses by amenities
 *     description: Returns businesses matching the specified amenities filter
 *     parameters:
 *       - in: query
 *         name: wifi
 *         schema:
 *           type: boolean
 *         description: Filter businesses with WiFi
 *         example: true
 *       - in: query
 *         name: parkingSpace
 *         schema:
 *           type: boolean
 *         description: Filter businesses with parking space
 *         example: true
 *       - in: query
 *         name: spa
 *         schema:
 *           type: boolean
 *         description: Filter businesses with spa
 *         example: false
 *       - in: query
 *         name: ola
 *         schema:
 *           type: boolean
 *         description: Filter businesses with Ola service
 *         example: true
 *     responses:
 *       200:
 *         description: Successfully filtered businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Businesses filtered successfully"
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 filtersApplied:
 *                   type: object
 *                   properties:
 *                     wifi:
 *                       type: boolean
 *                       example: true
 *                     parkingSpace:
 *                       type: boolean
 *                       example: false
 *                     spa:
 *                       type: boolean
 *                       example: true
 *                     ola:
 *                       type: boolean
 *                       example: false
 *                 businesses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Business'
 *       400:
 *         description: Invalid filter parameters
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /business:
 *   get:
 *     tags: [Business]
 *     summary: Get all businesses (alternative endpoint)
 *     responses:
 *       200:
 *         description: List of all businesses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Business'
 *       500:
 *         description: Server error
 */
router.get("/business", businessController.getAllBusiness);

/**
 * @swagger
 * /businesses/{id}:
 *   put:
 *     tags: [Business]
 *     summary: Update a business
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Business'
 *     responses:
 *       200:
 *         description: Business updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Business'
 *       500:
 *         description: Server error
 */
router.put("/businesses/:id", businessController.updateBusiness);

/**
 * @swagger
 * /businesses/{businessId}/posts:
 *   get:
 *     tags: [Business]
 *     summary: Get posts for a business
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of business posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessPost'
 *       500:
 *         description: Server error
 */
router.get(
  "/businesses/:businessId/posts",
  catchErrors(businessController.getBusinessPosts)
);

// ==================== Business Posts Routes ====================

/**
 * @swagger
 * /bussiness/post:
 *   post:
 *     tags: [Business Posts]
 *     summary: Create a business post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessPost'
 *     responses:
 *       201:
 *         description: Business post created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessPost'
 *       500:
 *         description: Server error
 */
router.post("/bussiness/post", catchErrors(businessPostsController.createPost));

/**
 * @swagger
 * /bussiness/posts:
 *   get:
 *     tags: [Business Posts]
 *     summary: Get all business posts
 *     responses:
 *       200:
 *         description: List of all business posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessPost'
 *       500:
 *         description: Server error
 */
router.get(
  "/bussiness/posts",
  catchErrors(businessPostsController.getAllPosts)
);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     tags: [Business Posts]
 *     summary: Get a business post by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Business post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessPost'
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.get("/posts/:id", catchErrors(businessPostsController.getPostById));

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     tags: [Business Posts]
 *     summary: Update a business post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessPost'
 *     responses:
 *       200:
 *         description: Business post updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessPost'
 *       500:
 *         description: Server error
 */
router.put("/posts/:id", catchErrors(businessPostsController.updatePost));

/**
 * @swagger
 * /like/{id}:
 *   put:
 *     tags: [Business Posts]
 *     summary: Like/unlike a business post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Like status toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BusinessPost'
 *       500:
 *         description: Server error
 */
router.put("/like/:id", catchErrors(businessPostsController.toggleLike));

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     tags: [Business Posts]
 *     summary: Delete a business post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Business post deleted
 *       500:
 *         description: Server error
 */
router.delete("/posts/:id", catchErrors(businessPostsController.deletePost));

/**
 * @swagger
 * /posts/{businessId}/posts:
 *   get:
 *     tags: [Business Posts]
 *     summary: Get posts for a business (alternative endpoint)
 *     parameters:
 *       - in: path
 *         name: businessId
 *         schema:
 *           type: string
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: List of business posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BusinessPost'
 *       500:
 *         description: Server error
 */
router.get(
  "/posts/:businessId/posts",
  catchErrors(businessPostsController.getBusinessPosts)
);

// ==================== Media Routes ====================

/**
 * @swagger
 * /uploads/{id}:
 *   get:
 *     tags: [Media]
 *     summary: Get an uploaded image
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *       500:
 *         description: Server error
 */
router.get("/uploads/:id", getImage);

module.exports = router;
