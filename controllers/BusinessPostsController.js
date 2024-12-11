const BusinessPost = require("../models/BusinessPost");
const { Business } = require("../models/index");
const multer = require("multer");
const path = require("path");

// Multer storage and configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Upload directory
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

const businessPostsController = {
  // Create a new BusinessPost
  createPost: async (req, res) => {
    const uploadHandler = upload.array("media", 10); // Allow up to 10 media files

    uploadHandler(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res
          .status(501)
          .json({ message: "Error uploading files", error: err.message });
      }

      const { businessId, postText } = req.body;

      try {
        // Find the associated business
        const business = await Business.findByPk(businessId);
        if (!business) {
          return res.status(404).json({ message: "Business not found" });
        }

        // Extract uploaded media file paths and save relative paths
        const mediaPaths = req.files
          .map(
            (file) =>
              `${req.protocol}://${req.get("host")}/images/${file.filename}`
          )
          .toString();

        // Create a new post associated with the business
        const newPost = await BusinessPost.create({
          media: mediaPaths,
          postText,
          businessId: business.id, // Assuming the foreign key is named `BusinessId`
        });

        res.status(201).json({
          message: "Post created successfully",
          data: newPost,
        });
      } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({
          message: "Error creating post",
          error: error.message,
        });
      }
    });
  },

  // Get all BusinessPosts
  getAllPosts: async (req, res) => {
    try {
      const posts = await BusinessPost.findAll({
        include: [
          {
            model: Business,
            as: "Business",
          },
        ],
      });
      return res.status(200).json({
        message: "Posts retrieved successfully",
        data: posts,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve posts",
        error: error.message,
      });
    }
  },

  // Get a single BusinessPost by ID
  getPostById: async (req, res) => {
    try {
      const { id } = req.params;

      const post = await BusinessPost.findByPk(id, {
        include: [
          {
            model: Business,
            as: "Business",
          },
        ],
      });

      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      return res.status(200).json({
        message: "Post retrieved successfully",
        data: post,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve post",
        error: error.message,
      });
    }
  },

  // Update a BusinessPost
  updatePost: async (req, res) => {
    try {
      const { id } = req.params;
      const { postText, media } = req.body;

      const post = await BusinessPost.findByPk(id);
      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      const updatedPost = await post.update({ postText, media });
      return res.status(200).json({
        message: "Post updated successfully",
        data: updatedPost,
      });
    } catch (error) {
      return res.status(400).json({
        message: "Failed to update post",
        error: error.message,
      });
    }
  },

  // Delete a BusinessPost
  deletePost: async (req, res) => {
    try {
      const { id } = req.params;

      const post = await BusinessPost.findByPk(id);
      if (!post) {
        return res.status(404).json({
          message: "Post not found",
        });
      }

      await post.destroy();
      return res.status(200).json({
        message: "Post deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to delete post",
        error: error.message,
      });
    }
  },

  getBusinessPosts: async (req, res) => {
    const { businessId } = req.params; // Extract business ID from route parameters

    try {
      // Find the business with its associated posts
      const businessWithPosts = await BusinessPost.findByPk(businessId, {
        include: {
          model: Business,
          as: "Business",
          attributes: ["id", "media", "postText", "createdAt"],
        },
        attributes: ["id", "name", "type"], // Fields from the Business model
      });

      if (!businessWithPosts) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.status(200).json({
        message: "Posts retrieved successfully",
        business: {
          id: businessWithPosts.id,
          name: businessWithPosts.name,
          type: businessWithPosts.type,
        },
        posts: businessWithPosts.posts,
      });
    } catch (error) {
      console.error("Error retrieving posts:", error);
      res.status(500).json({
        message: "Error retrieving posts",
        error: error.message,
      });
    }
  },
  toggleLike: async (req, res) => {
    const { id: postId } = req.params;
    const { userId } = req.body;
    console.log(postId, userId);
    try {
      const post = await BusinessPost.findByPk(postId);
      if (!post) return false;

      let likes = post.likes || [];
      if (typeof likes === "string") {
        likes = JSON.parse(likes);
      }
      if (!Array.isArray(likes)) {
        likes = [];
      }

      if (likes.includes(userId)) {
        likes = likes.filter((id) => id !== userId);
      } else {
        likes.push(userId);
      }

      await post.update({ likes });
      return res.status(200).json({
        message: "Post liked by successfully",
        post,
      });
    } catch (err) {
      console.error("Error updating post:", err);
      throw new Error("Error updating likes");
    }
  },
};

module.exports = businessPostsController;
