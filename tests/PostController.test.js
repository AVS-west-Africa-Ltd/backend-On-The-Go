const request = require('supertest');
const { app } = require('../app');
const PostService = require('../services/PostService');
const ImageService = require('../services/ImageService');
const path = require('path');
const fs = require('fs');

jest.mock('../services/PostService');
jest.mock('../services/ImageService');
// Mock fs.unlink to avoid actual file operations
jest.mock('fs', () => ({
    unlink: jest.fn((filePath, callback) => {
        if (filePath.includes('error')) {
            callback(new Error('File deletion error')); // Simulate an error
        } else {
            callback(null); // Simulate successful deletion
        }
    }),
}));

describe('PostController Tests', () => {

    describe('POST /user/post', () => {
        it('should return 400 if fields are missing', async () => {
            const response = await request(app).post('/api/v1/user/post').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('All fields are required');
        });

        it('should create a post successfully', async () => {
            const postData = { userId: 1, businessId: 2, description: 'Test description', rating: 5 };

            // Mock the PostService.createPost function
            PostService.createPost.mockResolvedValue({
                id: 1, userId: 1, businessId: 2, description: 'Test description', rating: 5
            });

            const response = await request(app)
                .post('/api/v1/user/post')
                .send(postData);

            // Log response to debug if necessary
            console.log(response.body);  // Debugging line

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Post successfully created');
        });
    });

    // describe('POST /user/post', () => {
    //     it('should return 400 if fields are missing', async () => {
    //         const response = await request(app).post('/api/v1/user/post').send({});
    //         expect(response.status).toBe(400);
    //         expect(response.body.message).toBe('All fields are required');
    //     });
    //
    //     it('should return 400 if no images are provided', async () => {
    //         const postData = { userId: 1, businessId: 2, description: 'Test description', rating: 5 };
    //         const response = await request(app)
    //             .post('/api/v1/user/post')
    //             .field(postData); // Send without files
    //
    //         expect(response.status).toBe(400);
    //         expect(response.body.message).toBe('At least one image is required');
    //     });
    //
    //     it('should create a post successfully with images', async () => {
    //         const postData = { userId: 1, businessId: 2, description: 'Test description', rating: 5 };
    //
    //         // Mock PostService.createPost to return a new post
    //         PostService.createPost.mockResolvedValue({
    //             id: 1, userId: 1, businessId: 2, description: 'Test description', rating: 5
    //         });
    //
    //         // Mock ImageService.createImage to resolve successfully
    //         ImageService.createImage.mockResolvedValue([]);
    //
    //         const response = await request(app)
    //             .post('/api/v1/user/post')
    //             .field('userId', postData.userId)
    //             .field('businessId', postData.businessId)
    //             .field('description', postData.description)
    //             .field('rating', postData.rating)
    //             .attach('images', path.resolve(__dirname, './testImage1.jpg'))
    //             .attach('images', path.resolve(__dirname, './testImage2.jpg')); // Attach multiple images
    //
    //         expect(response.status).toBe(201);
    //         expect(response.body.message).toBe('Post successfully created');
    //     });
    // });

    describe('GET /user/post/:postId', () => {
        it('should get a post by ID successfully', async () => {
            const postId = 1;
            const post = { id: postId, userId: 1, businessId: 2, description: 'Test description', rating: 5 };
            PostService.getPostById.mockResolvedValue(post);

            const response = await request(app).get(`/api/v1/user/post/${postId}`);

            expect(response.status).toBe(200);
            expect(response.body.info).toEqual(post);
        });

        it('should return 404 if post not found', async () => {
            const postId = 1;
            PostService.getPostById.mockResolvedValue(null);

            const response = await request(app)
                .get(`/api/v1/user/post/${postId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Post not found');
        });
    });

    describe('GET /posts/user', () => {
        it('should return 404 if no posts are found', async () => {
            PostService.getPosts.mockResolvedValueOnce([]);

            const response = await request(app).get('/api/v1/posts/user');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Posts not found');
        });

        it('should return a list of posts', async () => {
            const posts = [
                { id: 1, userId: 1, businessId: 2, description: 'Test description 1', rating: 5 },
                { id: 2, userId: 1, businessId: 3, description: 'Test description 2', rating: 4 },
            ];
            PostService.getPosts.mockResolvedValueOnce(posts);

            const response = await request(app).get('/api/v1/posts/user');

            expect(response.status).toBe(200);
            expect(response.body.info).toEqual(posts);
        });

        it('should return 500 if an error occurs', async () => {
            PostService.getPosts.mockRejectedValueOnce(new Error('Database error'));

            const response = await request(app).get('/api/v1/posts/user');

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Database error');
        });
    });

    describe('PUT /update/post/:postId', () => {
        it('should update a post successfully', async () => {
            const postId = 1;
            const updatedData = { description: 'Updated description' };
            const updatedPost = { id: postId, ...updatedData };
            PostService.updatePost.mockResolvedValue(updatedPost);

            const response = await request(app)
                .put(`/api/v1/update/post/${postId}`)
                .send(updatedData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post successfully updated');
        });

        it('should return 404 if post not found', async () => {
            const postId = 1;
            const updatedData = { description: 'Updated description' };
            PostService.updatePost.mockResolvedValue(false);

            const response = await request(app)
                .put(`/api/v1/update/post/${postId}`)
                .send(updatedData);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Post not found');
        });
    });

    describe('DELETE /delete/post/:postId', () => {
        it('should delete a post successfully', async () => {
            const postId = 1;
            PostService.deletePost.mockResolvedValue(true);

            const response = await request(app)
                .delete(`/api/v1/delete/post/${postId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post deleted successfully');
        });

        it('should return 404 if post not found', async () => {
            const postId = 1;
            PostService.deletePost.mockResolvedValue(false);

            const response = await request(app)
                .delete(`/api/v1/delete/post/${postId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Post not found');
        });
    });

    // describe('DELETE /delete/post/:postId', () => {
    //     it('should delete a post successfully', async () => {
    //         const postId = 1;
    //
    //         // Mock ImageService.getImagesByPostId to return associated images
    //         ImageService.getImagesByPostId.mockResolvedValue([
    //             { filePath: 'uploads/testImage1.jpg' },
    //             { filePath: 'uploads/testImage2.jpg' }
    //         ]);
    //
    //         // Mock PostService.deletePost to return true
    //         PostService.deletePost.mockResolvedValue(true);
    //
    //         // Mock fs.unlink to simulate file deletion
    //         jest.spyOn(fs, 'unlink').mockImplementation((filePath, callback) => callback(null));
    //
    //         const response = await request(app).delete(`/api/v1/delete/post/${postId}`);
    //         expect(response.status).toBe(200);
    //         expect(response.body.message).toBe('Post deleted successfully');
    //     });
    //
    //     it('should return 404 if post not found', async () => {
    //         const postId = 1;
    //
    //         // Mock PostService.deletePost to return false
    //         PostService.deletePost.mockResolvedValue(false);
    //
    //         const response = await request(app).delete(`/api/v1/delete/post/${postId}`);
    //         expect(response.status).toBe(404);
    //         expect(response.body.message).toBe('Post not found');
    //     });
    //
    //     it('should handle file deletion errors gracefully', async () => {
    //         const postId = 1;
    //
    //         // Mock ImageService.getImagesByPostId to return associated images
    //         ImageService.getImagesByPostId.mockResolvedValue([
    //             { filePath: 'uploads/testImage1.jpg' }
    //         ]);
    //
    //         // Mock PostService.deletePost to return true
    //         PostService.deletePost.mockResolvedValue(true);
    //
    //         // Mock fs.unlink to simulate a file deletion error
    //         jest.spyOn(fs, 'unlink').mockImplementation((filePath, callback) => {
    //             callback(new Error('File deletion error'));
    //         });
    //
    //         const response = await request(app).delete(`/api/v1/delete/post/${postId}`);
    //         expect(response.status).toBe(200); // Post deletion is successful despite file deletion errors
    //         expect(response.body.message).toBe('Post deleted successfully');
    //     });
    // });
    //

    describe('POST /:userId/likes/:postId', () => {
        it('should toggle like on a post successfully', async () => {
            const postId = 1;
            const userId = 1;
            const post = { id: postId, userId: 1, likes: [userId] };
            PostService.toggleLike.mockResolvedValue(post);

            const response = await request(app)
                .post(`/api/v1/${userId}/likes/${postId}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Post toggled successfully');
        });

        it('should return 404 if post not found', async () => {
            const postId = 1;
            const userId = 1;
            PostService.toggleLike.mockResolvedValue(null);

            const response = await request(app)
                .post(`/api/v1/${userId}/likes/${postId}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Post not found');
        });
    });

});

