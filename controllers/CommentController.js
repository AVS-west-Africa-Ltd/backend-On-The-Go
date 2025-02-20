const CommentService = require("../services/CommentService");

class CommentController {
  static async createComment(req, res) {
    const { postId } = req.params;
    const { authorId, content, parentId, postType } = req.body; // Get postType from request body

    if (!content || !authorId || !postType) {
      return res
        .status(400)
        .json({ message: "Content, authorId, and postType are required" });
    }

    try {
      const comment = await CommentService.createComment(
        Number(postId), // Ensure postId is an integer
        postType,
        authorId,
        content,
        parentId
      );

      return res
        .status(201)
        .json({ message: "Comment created successfully", comment });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getComments(req, res) {
    const { postId } = req.params;
    const { postType } = req.query; // Get postType from query parameters

    if (!postType) {
      return res
        .status(400)
        .json({ error: "postType is required (user/business)" });
    }

    try {
      const comments = await CommentService.getCommentsByPost(postId, postType);
      return res.status(200).json({ comments });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteComment(req, res) {
    const { postId, commentId } = req.params;
    const { userId, postType } = req.body; // Include postType in the request body

    if (!postType) {
      return res
        .status(400)
        .json({ message: "postType is required (user/business)" });
    }

    try {
      const result = await CommentService.deleteComment(
        Number(postId), // Convert postId to a number
        Number(commentId), // Convert commentId to a number
        Number(userId), // Convert userId to a number
        postType
      );

      if (!result) {
        return res
          .status(404)
          .json({ message: "Comment not found or unauthorized" });
      }

      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
      return res.status(403).json({ error: err.message });
    }
  }
}

module.exports = CommentController;
