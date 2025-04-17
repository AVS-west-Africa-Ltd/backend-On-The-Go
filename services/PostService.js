const Post = require("../models/Post");
const { Op, Sequelize } = require("sequelize");
const multer = require("multer");
const path = require("path");
const Comment = require("../models/Comment");
const Business = require("../models/Business");
const User = require("../models/User");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

class PostService {
  static async createPost(data) {
    try {
      return await Post.create(data);
    } catch (err) {
      throw err;
    }
  }

  static async createImage(data) {
    const uploadHandler = upload.array("media", 10);
    uploadHandler(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res
          .status(501)
          .json({ message: "Error uploading files", error: err.message });
      }
      try {
        const newPost = await BusinessPost.create({
          media: data,
        });
      } catch (error) {
        throw new Error("Error uploading images");
      }
    });
  }

  static async getPostById(postId) {
    try {
      return await Post.findByPk(postId);
    } catch (err) {
      throw new Error("Error fetching post");
    }
  }

  static async getPostsByUserId(userId, postType) {
    try {
      return await Post.findAll({
        where: {
          [Op.and]: [{ userId: userId }, { postType: postType }],
        },
      });
    } catch (e) {
      throw e;
    }
  }

  // static async getPosts() {
  //   try {
  //     return await Post.findAll({
  //       include: [
  //         {
  //           model: Comment,
  //           as: 'comments', // Matches the alias defined in the association
  //           include: [
  //             {
  //               model: Comment,
  //               as: 'replies', // Nested comments (replies)
  //             },
  //           ],
  //         },
  //         {
  //           model: Business,
  //           as: 'business',
  //         },
  //         {
  //           model: User,
  //           as: 'user',
  //         }
  //       ],
  //       order: [["createdAt", "DESC"]],
  //     });
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  static async getPosts() {
    try {
      const posts = await Post.findAll({
        include: [
          {
            model: Comment,
            as: "comments",
            include: [
              {
                model: Comment,
                as: "replies",
              },
            ],
          },
          {
            model: Business,
            as: "business",
          },
          {
            model: User,
            as: "user",
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Process fields to parse JSON strings
      return posts.map((post) => ({
        ...post.toJSON(),
        likes: JSON.parse(post.likes || "[]"),
        media: JSON.parse(post.media || "[]"),
        bookmarks: JSON.parse(post.bookmarks || "[]"),
        business: post.business
          ? {
              ...post.business.toJSON(),
              amenities: JSON.parse(post.business.amenities || "[]"),
              social: JSON.parse(post.business.social || "[]"),
              wifi: JSON.parse(post.business.wifi || "[]"),
              hours: JSON.parse(post.business.hours || "{}"),
            }
          : null,
      }));
    } catch (error) {
      throw error;
    }
  }

  static async updatePost(postId, updates) {
    try {
      const post = await Post.findByPk(postId);
      if (!post) return false;
      return await post.update(updates);
    } catch (err) {
      throw new Error("Error updating post");
    }
  }

  static async deletePost(postId) {
    try {
      const post = await Post.findByPk(postId);
      if (!post) return false;
      return await post.destroy();
    } catch (err) {
      throw new Error("Error deleting post");
    }
  }

  static async toggleLike(postId, userId) {
    try {
      const post = await Post.findByPk(postId, {
        attributes: ["id", "likes"],
      });

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
      return post;
    } catch (err) {
      console.error("Error updating post:", err);
      throw new Error("Error updating likes");
    }
  }

  static async ratePost(postId, newRating) {
    try {
      const post = await Post.findByPk(postId);
      if (!post) return false;

      const currentRating = post.rating || 0;
      const ratingsCount = post.ratingsCount || 0;

      const totalRating = currentRating * ratingsCount + newRating;
      const newRatingsCount = ratingsCount + 1;
      const averageRating = totalRating / newRatingsCount;

      await post.update({
        rating: averageRating,
        ratingsCount: newRatingsCount,
      });

      return post;
    } catch (err) {
      console.error("Error updating post:", err);
      throw new Error("Error updating post rating");
    }
  }

  static async toggleBookmark(postId, userId) {
    try {
      const post = await Post.findByPk(postId);
      if (!post) return false;

      let bookmarks = post.bookmarks || [];
      if (typeof bookmarks === "string") {
        bookmarks = JSON.parse(bookmarks);
      }
      if (!Array.isArray(bookmarks)) {
        bookmarks = [];
      }

      if (bookmarks.includes(userId)) {
        bookmarks = bookmarks.filter((id) => id !== userId);
      } else {
        bookmarks.push(userId);
      }

      await post.update({ bookmarks });
      return post;
    } catch (err) {
      console.log(err);
      throw new Error("Error toggling bookmark");
    }
  }

  static async getBookmarkedPostsByUser(userId) {
    try {
      return await Post.findAll({
        where: Sequelize.literal(`JSON_CONTAINS(bookmarks, '"${userId}"')`),
        attributes: { exclude: ["bookmarks"] },
      });
    } catch (err) {
      console.error(err);
      throw new Error("Error fetching bookmarked posts");
    }
  }

  static async getPostStatistics(userId) {
    try {
      // Get total posts count
      const totalPosts = await Post.count({
        where: { userId }
      });
  
      // Get posts by rating categories
      const highRatingPosts = await Post.count({
        where: { 
          userId,
          rating: { [Op.gte]: 4 } // 4 stars and above
        }
      });
  
      const mediumRatingPosts = await Post.count({
        where: { 
          userId,
          rating: { [Op.between]: [2, 3.99] } // 2-3.99 stars
        }
      });
  
      const lowRatingPosts = await Post.count({
        where: { 
          userId,
          rating: { [Op.lt]: 2 } // Below 2 stars
        }
      });
  
      return {
        totalPosts,
        highRatingPosts,
        mediumRatingPosts,
        lowRatingPosts
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PostService;
