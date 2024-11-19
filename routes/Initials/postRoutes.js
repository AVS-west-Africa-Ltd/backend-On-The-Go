const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to create a post
router.post('/create', authMiddleware, postController.createPost);

// Route to get all posts (optionally limited by query parameter)
router.get('/all', authMiddleware, postController.getAllPosts);

// Route to get a post by ID
router.get('/:id', authMiddleware, postController.getPostById);

// Route to update a post by ID
router.put('/:id', authMiddleware, postController.updatePost);

// Route to delete a post by ID
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;
