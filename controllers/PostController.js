const PostService = require("../services/PostService");
const ImageService = require("../services/ImageService");
const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

// Maximum file size (5MB)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "video/mp4": "mp4",
  // 'application/pdf': 'pdf'
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(
      new Error(
        `File type ${
          file.mimetype
        } is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(
          ", "
        )}`
      ),
      false
    );
    return;
  }
  cb(null, true);
};

// Error handling middleware
// const handleMulterError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
//       });
//     }
//   }
//   next(error);
// };

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `posts/${Date.now()}-${file.originalname}`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum number of files per upload
  },
  fileFilter: fileFilter,
});

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
        // Get the S3 URLs from the uploaded files
        const media = req.files.map((file) => file.location).toString();

        let payload = { userId, description, rating, businessId, media };

        const post = await PostService.createPost(payload);

        return res.status(201).json({
          message: "Post successfully created",
          post,
        });
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
