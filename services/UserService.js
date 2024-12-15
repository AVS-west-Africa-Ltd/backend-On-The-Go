
const User = require('../models/User');
const { Op } = require('sequelize');
const Notification = require('../models/Notification');

class UserService {
    // Create a new user
    static async createUser(data) {
        try {
            return await User.create(data);
        } catch (error) {
            throw new Error('Error creating user');
        }
    }

    // Get user by ID
    static async getUserById(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;
            return user;
        } catch (error) {
            throw new Error('Error fetching user');
        }
    }

    // Get user by email/username
    static async getUserByEmailOrUsername(props) {
        try {
            return await User.findOne(props);
        } catch (error) {
            throw new Error('Error fetching user');
        }
    }

    // Get all users
    static async getUsers(props) {
        try {
            if(props) return await User.findAll(props);
            return await User.findAll({});
        }
        catch (error) {
            throw new Error('Error fetching users');
        }
    }


    // Update user information
    static async updateUser(userId, data) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;
            return await user.update(data);
        } catch (error) {
            throw new Error('Error updating user');
        }
    }

    // Delete a user
    static async deleteUser(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;
            return await user.destroy();
        } catch (error) {
            throw new Error('Error deleting user');
        }
    }

    // Add follower to user
    static async addFollower(userId, followerId) {
        try {
            const user = await User.findByPk(userId);
            const follower = await User.findByPk(followerId);

            if (!user || !follower) return false;

            // Add follower to the user's followers
            await user.addFollower(follower);

            // Notification for the user being followed
            await Notification.create({
                userId: userId, // The user being followed
                followerId: follower.id, // The follower
                notificationType: 'followed', // Indicates the type of notification
                message: `${follower.username} started following you.`,
            });

            // Notification for the follower who started following someone
            await Notification.create({
                userId: follower.id, // The follower
                followerId: user.id, // The user being followed
                notificationType: 'following', // Indicates the type of notification
                message: `You started following ${user.username}.`,
            });

            return user;
        } catch (error) {
            throw new Error(`Error adding follower: ${error.message}`);
        }
    }


    // Remove follower from user
    static async removeFollower(userId, followerId) {
        try {
            // Find both users
            const user = await User.findByPk(userId);
            const follower = await User.findByPk(followerId);

            if (!user || !follower) return false;

            // Remove the follower relationship
            await user.removeFollower(follower);

            // Remove the initial "followed" notification, if it exists
            const followNotification = await Notification.findOne({
                where: {
                    userId: userId,
                    followerId: follower.id,
                    type: 'followed',
                },
            });
            if (followNotification) {
                await followNotification.destroy(); // Delete the "followed" notification
            }

            // Create a new "unfollow" notification
            await Notification.create({
                userId: userId, // The user being unfollowed
                followerId: follower.id, // The user who unfollowed
                type: 'unfollowed', // A new type for "unfollowed"
                message: `${follower.username} unfollowed you.`,
            });

            // Return the user who was unfollowed
            return user;
        } catch (error) {
            throw new Error(`Error removing follower: ${error.message}`);
        }
    }


    // Get notifications for user
    static async getNotifications(userId) {
        try {
            const notification = await Notification.findAll({ where: { userId } });
            if (!notification) return false;
            return notification;
        } catch (error) {
            throw new Error(`Error retrieving notifications: ${error.message}`);
        }
    }

    // Mark notification as read
    static async markNotificationAsRead(notificationId) {
        try {
            const notification = await Notification.findByPk(notificationId);
            if (!notification) return false;
            notification.read = true;
            await notification.save();
            return notification;
        } catch (error) {
            throw new Error(`Error marking notification as read: ${error.message}`);
        }
    }

    // Get user and their followers
    static async getUserWithFollowers(userId) {
        try {
            const user = await User.findByPk(userId, {
                include: {
                    model: User,
                    as: 'Followers',
                    attributes: ['id', 'username', 'email'],
                    through: { attributes: [] },
                },
            });

            if (!user) return false;
            return user;
        } catch (error) {
            throw new Error(`Error fetching user with followers: ${error.message}`);
        }
    };

    // Add an interest to the user's interests array
    static async addInterest(userId, newInterest) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;

            const interests = user.interests || [];
            interests.push(newInterest);
            await user.update({ interests });
            return interests;
        } catch (error) {
            throw new Error(`Error adding interest: ${error.message}`);
        }
    }

    // Update an interest by index
    static async updateInterest(userId, interestIndex, updatedInterest) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;

            // Check if the index is valid
            const interests = user.interests || [];
            if (interestIndex < 0 || interestIndex >= interests.length) {
                return false;
            }

            interests[interestIndex] = updatedInterest;
            await user.update({ interests });
            return interests;
        } catch (error) {
            throw new Error(`Error updating interest: ${error.message}`);
        }
    }

    static async deleteInterest(userId, interestIndex) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;

            const interests = user.interests || [];
            if (interestIndex < 0 || interestIndex >= interests.length) {
                return false;
            }

            interests.splice(interestIndex, 1);
            await user.update({ interests });
            return interests;
        } catch (error) {
            throw new Error(`Error deleting interest: ${error.message}`);
        }
    }

}

module.exports = UserService;
