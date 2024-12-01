const request = require('supertest');
const { app } = require('../app');
const userService = require('../services/UserService');
const bcrypt = require('bcryptjs');
const jwtUtil = require('../utils/jwtUtil');

jest.mock('../services/UserService');
jest.mock('bcryptjs');
jest.mock('../utils/jwtUtil');

describe('UserController Tests', () => {
    describe('POST /api/v1/register', () => {
        it('should return 400 if fields are missing', async () => {
            const response = await request(app).post('/api/v1/register').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('All fields are required');
        });

        it('should return 400 if user already exists', async () => {
            userService.getUserByEmailOrUsername.mockResolvedValueOnce({});

            const response = await request(app)
                .post('/api/v1/register')
                .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('User already registered');
        });

        it('should return 201 on successful registration', async () => {
            userService.getUserByEmailOrUsername.mockResolvedValueOnce(null);
            userService.createUser.mockResolvedValueOnce({ save: jest.fn() });

            const response = await request(app)
                .post('/api/v1/register')
                .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User registered successfully');
        });
    });

    describe('POST /api/v1/login', () => {
        it('should return 400 if fields are missing', async () => {
            const response = await request(app).post('/api/v1/login').send({});
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('All fields are required');
        });

        it('should return 400 if user does not exist', async () => {
            userService.getUserByEmailOrUsername.mockResolvedValueOnce(null);

            const response = await request(app)
                .post('/api/v1/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should return 401 if password is incorrect', async () => {
            userService.getUserByEmailOrUsername.mockResolvedValueOnce({ password: 'hashedpassword' });
            bcrypt.compareSync.mockReturnValueOnce(false);

            const response = await request(app)
                .post('/api/v1/login')
                .send({ email: 'test@example.com', password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Invalid email or password');
        });

        it('should return 200 with token on successful login', async () => {
            userService.getUserByEmailOrUsername.mockResolvedValueOnce({ password: 'hashedpassword' });
            bcrypt.compareSync.mockReturnValueOnce(true);
            jwtUtil.generateToken.mockReturnValueOnce('mocked-token');

            const response = await request(app)
                .post('/api/v1/login')
                .send({ email: 'test@example.com', password: 'password123' });

            expect(response.status).toBe(200);
            expect(response.body.token).toBe('mocked-token');
        });
    });

    describe('GET /api/v1/users', () => {
        it('should return 404 if no users are found', async () => {
            userService.getUsers.mockResolvedValueOnce([]);

            const response = await request(app).get('/api/v1/users');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Users not found');
        });

        it('should return 200 with users', async () => {
            const users = [{ id: 1, username: 'testuser' }];
            userService.getUsers.mockResolvedValueOnce(users);

            const response = await request(app).get('/api/v1/users');

            expect(response.status).toBe(200);
            expect(response.body.info).toEqual(users);
        });
    });

    describe('GET /api/v1/user/:userId', () => {
        it('should return 404 if user is not found', async () => {
            userService.getUserById.mockResolvedValueOnce(null);

            const response = await request(app).get('/api/v1/user/1');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });

        it('should return 200 with user details', async () => {
            const user = { id: 1, username: 'testuser' };
            userService.getUserById.mockResolvedValueOnce(user);

            const response = await request(app).get('/api/v1/user/1');

            expect(response.status).toBe(200);
            expect(response.body.info).toEqual(user);
        });
    });

    describe('DELETE /api/v1/delete/user/:userId', () => {
        it('should return 404 if user is not found', async () => {
            userService.deleteUser.mockResolvedValueOnce(null);

            const response = await request(app).delete('/api/v1/delete/user/1');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });

        it('should return 200 if user is successfully deleted', async () => {
            userService.deleteUser.mockResolvedValueOnce({ id: 1 });

            const response = await request(app).delete('/api/v1/delete/user/1');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User deleted successfully');
        });
    });

    describe('PUT /api/v1/update/user/:userId', () => {
        it('should return 404 if user is not found', async () => {
            userService.updateUser.mockResolvedValueOnce(null);

            const response = await request(app)
                .put('/api/v1/update/user/1')
                .send({ username: 'updateduser' });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });

        it('should return 200 if user is successfully updated', async () => {
            const updatedUser = { id: 1, username: 'updateduser' };
            userService.updateUser.mockResolvedValueOnce(updatedUser);

            const response = await request(app)
                .put('/api/v1/update/user/1')
                .send({ username: 'updateduser' });

            expect(response.status).toBe(200);
            expect(response.body.info).toEqual(updatedUser);
        });
    });

    describe('POST /:userId/follow/:followerId', () => {
        it('should return 200 if follower is added successfully', async () => {
            userService.addFollower.mockResolvedValueOnce({ message: 'Follower added successfully' });

            const response = await request(app).post('/api/v1/1/follow/2');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Follower added successfully');
        });

        it('should return 404 if user not found', async () => {
            userService.addFollower.mockResolvedValueOnce(null);

            const response = await request(app).post('/api/v1/1/follow/2');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('DELETE /:userId/unfollow/:followerId', () => {
        it('should return 200 if follower is removed successfully', async () => {
            userService.removeFollower.mockResolvedValueOnce({ message: 'Follower removed successfully' });

            const response = await request(app).delete('/api/v1/1/unfollow/2');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Follower removed successfully');
        });

        it('should return 404 if user not found', async () => {
            userService.removeFollower.mockResolvedValueOnce(null);

            const response = await request(app).delete('/api/v1/1/unfollow/2');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('GET /notifications/:userId', () => {
        it('should return 200 with notifications', async () => {
            const notifications = [{ id: 1, message: 'Test notification' }];
            userService.getNotifications.mockResolvedValueOnce(notifications);

            const response = await request(app).get('/api/v1/notifications/1');

            expect(response.status).toBe(200);
            expect(response.body.notifications).toEqual(notifications); // Updated key
        });

        it('should return 404 if no notifications are found', async () => {
            userService.getNotifications.mockResolvedValueOnce(null);

            const response = await request(app).get('/api/v1/notifications/1');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('PATCH /notifications/:notificationId/read', () => {
        it('should return 200 if notification is marked as read', async () => {
            userService.markNotificationAsRead.mockResolvedValueOnce({ message: 'Notification marked as read' });

            const response = await request(app).patch('/api/v1/notifications/1/read');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification marked as read');
        });

        it('should return 404 if notification not found', async () => {
            userService.markNotificationAsRead.mockResolvedValueOnce(null);

            const response = await request(app).patch('/api/v1/notifications/1/read');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Notification not found');
        });
    });

    describe('GET /:userId/followers', () => {
        it('should return 200 with user and followers', async () => {
            const userWithFollowers = { id: 1, followers: [{ id: 2, username: 'testfollower' }] };
            userService.getUserWithFollowers.mockResolvedValueOnce(userWithFollowers);

            const response = await request(app).get('/api/v1/1/followers');

            expect(response.status).toBe(200);
            expect(response.body.info).toEqual(userWithFollowers);
        });

        it('should return 404 if user not found', async () => {
            userService.getUserWithFollowers.mockResolvedValueOnce(null);

            const response = await request(app).get('/api/v1/1/followers');

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });
    });

    describe('POST /:userId/interests', () => {
        it('should return 200 if interest is added successfully', async () => {
            const updatedInterests = [
                { icon: 'coding-icon', title: 'Coding', type: 'Skill' },
            ];

            userService.addInterest.mockResolvedValueOnce(updatedInterests);

            const response = await request(app)
                .post('/api/v1/1/interests')
                .send({ icon: 'coding-icon', title: 'Coding', type: 'Skill' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Interest added');
            expect(response.body.interests).toEqual(updatedInterests);
        });

        it('should return 500 if an error occurs', async () => {
            userService.addInterest.mockRejectedValueOnce(new Error('Internal Server Error'));

            const response = await request(app)
                .post('/api/v1/1/interests')
                .send({ icon: 'coding-icon', title: 'Coding', type: 'Skill' });

            expect(response.status).toBe(500);
            expect(response.body.error).toBe('Internal Server Error');
        });
    });

    describe('PUT /:userId/interests/:index', () => {
        it('should return 200 if interest is updated successfully', async () => {
            userService.updateInterest.mockResolvedValueOnce({ message: 'Interest updated successfully' });

            const response = await request(app).put('/api/v1/1/interests/0').send({ interest: 'Reading' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Interest updated successfully');
        });
    });

    describe('DELETE /:userId/interests/:index', () => {
        it('should return 200 if interest is deleted successfully', async () => {
            userService.deleteInterest.mockResolvedValueOnce({ message: 'Interest deleted successfully' });

            const response = await request(app).delete('/api/v1/1/interests/0');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Interest deleted successfully');
        });
    });
});
