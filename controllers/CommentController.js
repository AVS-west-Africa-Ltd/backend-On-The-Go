const CommentService = require('../services/CommentService');

class CommentController {
    static async createComment(req, res) {
        const { postId } = req.params;
        const { authorId, content, parentId } = req.body;

        if (!content || !authorId) return res.status(400).json({ message: 'Content and authorId are required' });

        try {
            const comment = await CommentService.createComment(postId, authorId, content, parentId);
            return res.status(201).json({ message: 'Comment created successfully', comment });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async getComments(req, res) {
        const { postId } = req.params;

        try {
            const comments = await CommentService.getCommentsByPost(postId);
            return res.status(200).json({ comments });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    static async deleteComment(req, res) {
        const { postId, commentId, userId } = req.params;

        try {
            const result = await CommentService.deleteComment(postId, commentId, userId);
            if (!result) return res.status(404).json({ message: 'Comment not found' });
            return res.status(200).json({ message: 'Comment deleted successfully' });
        } catch (err) {
            return res.status(403).json({ error: err.message });
        }
    }
}

module.exports = CommentController;
