const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require("../models/User");


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

    static async deleteComment(postId, commentId, userId) {
        try {
            const post = await Post.findByPk(postId);

            if (!post) return false;

            if (post.userId !== userId) return false;

            const comment = await Comment.findByPk(commentId);
            if (!comment || comment.postId !== postId) return false;

            return await comment.destroy();
        } catch (err) {
            throw new Error(err.message || 'Error deleting comment');
        }
    }
}

module.exports = CommentService;
