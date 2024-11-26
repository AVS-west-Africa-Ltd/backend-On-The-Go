const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const PostController = require("../controllers/PostController");
const CommentController = require('../controllers/CommentController');

// User routes
router.post('/register', UserController.CreateUser);
router.post('/login', UserController.Login);
router.get('/users', UserController.getUsers);
router.get('/user/:userId', UserController.getUserById);
router.delete('/delete/user/:userId', UserController.deleteUser);
router.put('/update/user/:userId', UserController.updateUser);
router.post('/:userId/follow/:followerId', UserController.addFollower);
router.delete('/:userId/unfollow/:followerId', UserController.removeFollower);
router.get('/notifications/:userId', UserController.getNotifications);
router.patch('/notifications/:notificationId/read', UserController.markNotificationAsRead);
router.get('/:userId/followers', UserController.getUserWithFollowers);
router.post('/:userId/interests', UserController.addInterests);
router.put('/:userId/interests/:index', UserController.updateInterest);
router.delete('/:userId/interests/:index', UserController.deleteInterest);

// Post routes
router.post('/post', PostController.createPost);
router.get('/post/:postId', PostController.getPostById);
router.get('/posts', PostController.getPosts);
router.put('/update/post/:postId', PostController.updatePost);
router.delete('/delete/post/:postId', PostController.deletePost);
router.post('/:userId/likes/:postId', PostController.toggleLike);
router.post('/:postId/rating', PostController.ratePost);
router.post('/:userId/bookmark/:postId', PostController.bookmarkPost);
router.get('/users/:userId/bookmarks', PostController.getBookmarkedPosts);

// Comments routes
router.post('/posts/:postId/comments', CommentController.createComment);
router.get('/posts/:postId/comments', CommentController.getComments);
router.delete('/posts/:postId/comments/:commentId/:userId', CommentController.deleteComment);

module.exports = router;
