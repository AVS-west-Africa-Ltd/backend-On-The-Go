const request = require('supertest');
const { app } = require('../app'); // Adjust this path based on your app's location
const CommentService = require('../services/CommentService');

jest.mock('../services/CommentService');

describe('CommentController Tests', () => {
    describe('POST /posts/:postId/comments', () => {
        it('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/v1/posts/1/comments')
                .send({ content: 'Nice post!' }); // Missing `authorId`

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Content and authorId are required');
        });

        it('should return 201 and create a comment', async () => {
            const comment = { id: 1, content: 'Nice post!', authorId: 1, postId: 1 };
            CommentService.createComment.mockResolvedValueOnce(comment);

            const response = await request(app)
                .post('/api/v1/posts/1/comments')
                .send({ content: 'Nice post!', authorId: 1 });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Comment created successfully');
            expect(response.body.comment).toEqual(comment);
        });

        it('should return 500 if service throws an error', async () => {
            CommentService.createComment.mockRejectedValueOnce(new Error('Service error'));

            const response = await request(app)
                .post('/api/v1/posts/1/comments')
                .send({ content: 'Nice post!', authorId: 1 });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Service error');
        });
    });

    describe('GET /posts/:postId/comments', () => {
        it('should return 200 with comments', async () => {
            const comments = [
                {
                    id: 1,
                    content: 'Great post!',
                    replies: [{ id: 2, content: 'Thanks!' }],
                },
            ];
            CommentService.getCommentsByPost.mockResolvedValueOnce(comments);

            const response = await request(app).get('/api/v1/posts/1/comments');

            expect(response.status).toBe(200);
            expect(response.body.comments).toEqual(comments);
        });

        it('should return 500 if service throws an error', async () => {
            CommentService.getCommentsByPost.mockRejectedValueOnce(new Error('Service error'));

            const response = await request(app).get('/api/v1/posts/1/comments');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Service error');
        });
    });

    describe('DELETE /posts/:postId/comments/:commentId/:userId', () => {
        it('should return 404 if comment is not found', async () => {
            CommentService.deleteComment.mockResolvedValueOnce(false);

            const response = await request(app).delete('/api/v1/posts/1/comments/1/1');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Comment not found');
        });

        it('should return 200 if comment is deleted successfully', async () => {
            CommentService.deleteComment.mockResolvedValueOnce(true);

            const response = await request(app).delete('/api/v1/posts/1/comments/1/1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Comment deleted successfully');
        });

        it('should return 403 if deletion is not allowed', async () => {
            CommentService.deleteComment.mockRejectedValueOnce(new Error('Unauthorized action'));

            const response = await request(app).delete('/api/v1/posts/1/comments/1/1');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Unauthorized action');
        });
    });
});
