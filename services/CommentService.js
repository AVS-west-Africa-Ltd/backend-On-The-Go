const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

class CommentService {
  static async createComment(
    postId,
    postType,
    authorId,
    content,
    parentId = null
  ) {
    try {
      return await Comment.create({
        postId,
        postType, // Ensure we store the postType
        authorId,
        content,
        parentId,
      });
    } catch (err) {
      throw new Error("Error creating comment: " + err.message);
    }
  }

  // static async getCommentsByPost(postId) {
  //     try {
  //         return await Comment.findAll({
  //             where: { postId: postId, parentId: null },
  //             include: [
  //                 {
  //                     model: Comment,
  //                     as: 'replies',
  //                     include: [
  //                         {
  //                             model: User, // Replace `User` with your actual User model
  //                             as: 'author', // Alias for author details
  //                             attributes: ['id', 'firstName', 'lastName', 'picture', 'username'], // Specify fields you want to return
  //                         },
  //                     ],
  //                 },
  //                 {
  //                     model: User, // Include the author of the main comment
  //                     as: 'author', // Alias for author details
  //                     attributes: ['id', 'firstName', 'lastName', 'picture', 'username'], // Specify fields you want to return
  //                 },
  //             ],
  //             order: [["createdAt", "DESC"]],
  //         });
  //     } catch (err) {
  //         throw new Error('Error fetching comments');
  //     }
  // }

  static async getCommentsByPost(postId, postType) {
    try {
      return await Comment.findAll({
        where: {
          postId: Number(postId),
          postType: postType, // Ensure we fetch comments for the correct post type
          parentId: null,
        },
        include: [
          {
            model: Comment,
            as: "replies",
            include: [
              {
                model: User,
                as: "author",
                attributes: [
                  "id",
                  "firstName",
                  "lastName",
                  "picture",
                  "username",
                ],
              },
            ],
            order: [["createdAt", "ASC"]], // Order replies in chronological order
          },
          {
            model: User,
            as: "author",
            attributes: ["id", "firstName", "lastName", "picture", "username"],
          },
        ],
        order: [["createdAt", "DESC"]], // Order main comments in reverse chronological order
      });
    } catch (err) {
      throw new Error("Error fetching comments");
    }
  }

  static async deleteComment(postId, postType, commentId, userId) {
    try {
      let post;

      if (postType === "user") {
        post = await UserPost.findByPk(postId); // Assuming User Posts are stored in UserPost table
      } else if (postType === "business") {
        post = await BusinessPost.findByPk(postId); // Assuming Business Posts are stored in BusinessPost table
      } else {
        return false; // Invalid postType
      }

      if (!post) return false; // Post not found

      // Ensure the user deleting the comment is the author of the post
      if (postType === "user" && post.userId !== userId) return false;
      if (postType === "business" && post.businessId !== userId) return false; // Assuming businessId for Business Posts

      // Find the comment
      const comment = await Comment.findOne({
        where: { id: commentId, postId, postType },
      });

      if (!comment) return false; // Comment not found

      await comment.destroy();
      return true;
    } catch (err) {
      throw new Error(err.message || "Error deleting comment");
    }
  }
}

module.exports = CommentService;
