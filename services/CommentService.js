
const { User, Post, Comment } = require("../models");

class CommentService {
    
    static async createComment(postId, authorId, content, parentId = null) {
        try {
            return await Comment.create({
                postId: postId,
                authorId: authorId,
                content: content,
                parentId: parentId,
            });
        } catch (err) {
            throw new Error('Error creating comment');
        }
    }

    static async getCommentsByPost(postId) {
        try {
            return await Comment.findAll({
                where: { postId: postId, parentId: null },
                include: [
                    {
                        model: Comment,
                        as: 'replies',
                        include: [
                            {
                                model: User, // Replace `User` with your actual User model
                                as: 'author', // Alias for author details
                                attributes: ['id', 'firstName', 'lastName', 'picture', 'username'], // Specify fields you want to return
                            },
                        ],
                    },
                    {
                        model: User, // Include the author of the main comment
                        as: 'author', // Alias for author details
                        attributes: ['id', 'firstName', 'lastName', 'picture', 'username'], // Specify fields you want to return
                    },
                ],
                order: [["createdAt", "DESC"]],
            });
        } catch (err) {
            throw new Error('Error fetching comments');
        }
    }

    static async deleteComment(commentId, userId) {
        try {

            const comment = await Comment.findOne({ where:{ id:commentId,  authorId: userId }});
            if (!comment) return false;
            return await comment.destroy();
        } catch (err) {
            throw new Error(err.message || 'Error deleting comment');
        }
    }
}

module.exports = CommentService;
