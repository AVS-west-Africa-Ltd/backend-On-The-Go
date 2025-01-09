const PostService = require("../services/PostService");
const ImageService = require("../services/ImageService");
const multer = require("multer");
const path = require("path");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });\

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "business_posts", // Cloudinary folder where files will be stored
    allowed_formats: ["jpg", "jpeg", "pdf", "png", "gif"], // Allowed file types
    public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Generate unique file names
  },
});

const upload = multer({ storage: storage });

class PostController {
  static async createPost(req, res) {
    const uploadHandler = upload.array("media", 10);

    uploadHandler(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res
          .status(501)
          .json({ message: "Error uploading files", error: err.message });
      }

      const { userId, businessId, description, rating } = req.body;

      if (!description || !rating || !businessId || !userId)
        return res.status(400).json({ message: "All fields are required" });

      try {
        const media = req.files
          .map(
            (file) =>
              `https://api.onthegoafrica.com/uploads/${
                file.filename
              }`
          )
          .toString();

        let payload = { userId, description, rating, businessId, media };

        const post = await PostService.createPost(payload);

        return res.status(201).json({ message: "Post successfully created" });
      } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({
          message: "Error creating post",
          error: error.message,
        });
      }
    });
  }

  static async getPostById(req, res) {
    try {
      const { postId } = req.params;

      const post = await PostService.getPostById(postId);

      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({
        info: post,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getPosts(req, res) {
    try {
      const posts = await PostService.getPosts();
      if (!posts || posts.length === 0)
        return res.status(404).json({ message: "Posts not found", info: [] });
      return res.status(200).json({ info: posts });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updatePost(req, res) {
    try {
      const { postId } = req.params;

      const post = await PostService.updatePost(postId, req.body);
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({ message: "Post successfully updated" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deletePost(req, res) {
    try {
      const { postId } = req.params;

      const post = await PostService.deletePost(postId);

      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async toggleLike(req, res) {
    try {
      const { postId, userId } = req.params;

      const post = await PostService.toggleLike(postId, userId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({ message: "Post toggled successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message, message: error });
    }
  }

  static async ratePost(req, res) {
    try {
      const { postId } = req.params;

      const post = await PostService.ratePost(postId, req.body.rating);
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({ message: "Post rated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async bookmarkPost(req, res) {
    try {
      const { userId, postId } = req.params;

      const post = await PostService.toggleBookmark(postId, userId);
      if (!post) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({ message: "Bookmark toggled successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBookmarkedPosts(req, res) {
    try {
      const { userId } = req.params;

      const posts = await PostService.getBookmarkedPostsByUser(userId);
      if (!posts) return res.status(404).json({ message: "Post not found" });
      return res.status(200).json({ info: posts });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = PostController;
