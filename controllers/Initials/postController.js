const Post = require('../models/Post');

const postController = {
  // Create a post with associated media and amenities ratings
  createPost: async (req, res) => {
    const { locationName, locationAddress, details, overallRating, status, media, amenityRatings } = req.body;
    const userId = req.userId;

    try {
      const postId = await Post.createPost(userId, locationName, locationAddress, details, overallRating, status);

      // Add media associated with the post
      if (media && media.length > 0) {
        for (let m of media) {
          await Post.addPostMedia(postId, m.mediaType, m.mediaUrl, m.mediaThumbnailUrl);
        }
      }

      // Add amenity ratings associated with the post
      if (amenityRatings && amenityRatings.length > 0) {
        for (let a of amenityRatings) {
          await Post.addAmenityRating(postId, a.amenityId, a.rating);
        }
      }

      res.status(201).json({ message: 'Post created successfully', postId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating post' });
    }
  },

  // Get all posts with media and amenities
  getAllPosts: async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
      const posts = await Post.getAllPosts(limit);
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching posts' });
    }
  },

  // Get post by ID with media and amenities
  getPostById: async (req, res) => {
    const postId = req.params.id;

    try {
      const post = await Post.getPostById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.status(200).json(post);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching post' });
    }
  },

  // Update post (including media and amenity ratings)
  updatePost: async (req, res) => {
    const postId = req.params.id;
    const updates = req.body;

    try {
      const success = await Post.updatePost(postId, updates);
      if (!success) {
        return res.status(404).json({ message: 'Post not found or no changes made' });
      }
      res.status(200).json({ message: 'Post updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating post' });
    }
  },

  // Delete post by ID
  deletePost: async (req, res) => {
    const postId = req.params.id;

    try {
      const success = await Post.deletePost(postId);
      if (!success) {
        return res.status(404).json({ message: 'Post not found' });
      }
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting post' });
    }
  }
};

module.exports = postController;
