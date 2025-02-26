const User = require("../models/User");
const UserFollower = require("../models/UserFollowers");
const { Op } = require("sequelize");
const Notification = require("../models/Notification");
const sequelize = require("../config/database");
const NotificationService = require("./NotificationService");
const Business = require("../models/Business");
const UserFollowers = require("../models/UserFollowers");

class UserService {
  // Create a new user
  static async createUser(data) {
    try {
      return await User.create(data);
    } catch (error) {
      throw new Error("Error creating user");
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return false;
      return user;
    } catch (error) {
      throw new Error("Error fetching user");
    }
  }

  // Get user by email/username
  static async getUserByEmailOrUsername(props) {
    try {
      return await User.findOne(props);
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async getUsers(props) {
    try {
      if (props) return await User.findAll(props);
      return await User.findAll({});
    } catch (error) {
      throw error;
    }
  }

  // Update user information
  static async updateUser(userId, data) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return false;
      return await user.update(data);
    } catch (error) {
      throw new Error("Error updating user");
    }
  }

  // Delete a user
  static async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return false;
      return await user.destroy();
    } catch (error) {
      throw new Error("Error deleting user");
    }
  }

  // static async followUser(followerId, followedId) {
  //     const transaction = await sequelize.transaction();
  //
  //     try {
  //         // Check if users exist and are different
  //         if (followerId === followedId) {
  //             throw new Error('Users cannot follow themselves');
  //         }
  //
  //         const [follower, followed] = await Promise.all([
  //             User.findByPk(followerId),
  //             User.findByPk(followedId)
  //         ]);
  //
  //         if (!follower || !followed) {
  //             throw new Error('One or both users not found');
  //         }
  //
  //         // Check if already following
  //         const existingFollow = await UserFollower.findOne({
  //             where: {
  //                 followerId,
  //                 followedId,
  //                 status: 'active'
  //             }
  //         });
  //
  //         if (existingFollow) {
  //             throw new Error('Already following this user');
  //         }
  //
  //         // Create follow relationship
  //         await UserFollower.create({
  //             followerId,
  //             followedId,
  //             status: 'active'
  //         }, { transaction });
  //
  //         // Update follower counts
  //         await Promise.all([
  //             User.increment('followingCount', {
  //                 where: { id: followerId },
  //                 transaction
  //             }),
  //             User.increment('followersCount', {
  //                 where: { id: followedId },
  //                 transaction
  //             })
  //         ]);
  //
  //         // Create notification
  //         await Notification.create({
  //             recipientId: followedId,
  //             senderId: followerId,
  //             type: 'follow',
  //             message: `@${follower.username} started following you`,
  //             metadata: {
  //                 followerUsername: follower.username,
  //                 followerPicture: follower.picture
  //             }
  //         }, { transaction });
  //
  //         await transaction.commit();
  //         return true;
  //
  //     } catch (error) {
  //         await transaction.rollback();
  //         throw error;
  //     }
  // }

  static async followUser(followerId, followedId, followedType) {
    const transaction = await sequelize.transaction();

    try {
      if (!["individual", "business"].includes(followedType)) {
        throw new Error(
          "Invalid followedType. Must be 'individual' or 'business'"
        );
      }

      // Prevent users from following themselves (only for user-to-user follows)
      if (followedType === "individual" && followerId === followedId) {
        throw new Error("Users cannot follow themselves");
      }

      // Check if follower (user) exists
      const follower = await User.findByPk(followerId);
      if (!follower) throw new Error("Follower not found");

      // Check if followed entity exists (User or Business)
      let followedEntity;
      if (followedType === "individual") {
        followedEntity = await User.findByPk(followedId);
      } else if (followedType === "business") {
        followedEntity = await Business.findByPk(followedId);
      }

      if (!followedEntity) throw new Error("Followed entity not found");

      // Find any existing follow relationship
      const existingFollow = await UserFollower.findOne({
        where: { followerId, followedId, followedType },
      });

      if (existingFollow) {
        if (existingFollow.status === "active") {
          throw new Error("Already following this entity");
        }
        // Reactivate existing follow relationship
        await existingFollow.update({ status: "active" }, { transaction });
      } else {
        // Create new follow relationship
        await UserFollower.create(
          { followerId, followedId, followedType, status: "active" },
          { transaction }
        );
      }

      // Update follower counts
      if (followedType === "individual") {
        await Promise.all([
          User.increment("followingCount", {
            where: { id: followerId },
            transaction,
          }),
          User.increment("followersCount", {
            where: { id: followedId },
            transaction,
          }),
        ]);
      } else if (followedType === "business") {
        await Promise.all([
          User.increment("followingCount", {
            where: { id: followerId },
            transaction,
          }), // User follows business
          Business.increment("followersCount", {
            where: { id: followedId },
            transaction,
          }), // Business gains a follower
        ]);
      }

      // Create notification (only for user follows, not business)
      let notification = null;
      if (followedType === "individual") {
        notification = await Notification.create(
          {
            recipientId: followedId,
            senderId: followerId,
            type: "follow",
            message: `${follower.username} started following you`,
            metadata: {
              followerUsername: follower.username,
              followerPicture: follower.picture,
            },
          },
          { transaction }
        );
      }

      await transaction.commit();
      return { success: true, notification };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async unfollowUser(followerId, followedId, followedType) {
    const transaction = await sequelize.transaction();

    try {
      if (!["individual", "business"].includes(followedType)) {
        throw new Error(
          "Invalid followedType. Must be 'individual' or 'business'"
        );
      }

      // Find follow record
      const follow = await UserFollower.findOne({
        where: { followerId, followedId, followedType, status: "active" },
      });

      if (!follow) {
        throw new Error("Follow relationship not found");
      }

      // Update follow status
      await follow.update({ status: "blocked" }, { transaction });

      // Decrement following and followers count for both users and businesses
      if (followedType === "individual") {
        await Promise.all([
          User.decrement("followingCount", {
            where: { id: followerId },
            transaction,
          }),
          User.decrement("followersCount", {
            where: { id: followedId },
            transaction,
          }),
        ]);
      } else if (followedType === "business") {
        await Promise.all([
          User.decrement("followingCount", {
            where: { id: followerId },
            transaction,
          }), // User follows business
          Business.decrement("followersCount", {
            where: { id: followedId },
            transaction,
          }), // Business loses follower
        ]);
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getFollowers(userId, followedType) {
    // Determine the model based on the followedType
    const entityModel = followedType === "individual" ? User : Business;

    // Check if the followed entity (User or Business) exists
    const entity = await entityModel.findByPk(userId);
    if (!entity) {
      throw new Error(`${followedType} with ID ${userId} not found`);
    }

    // Fetch followers from UserFollowers
    const followers = await UserFollowers.findAll({
      where: { followedId: userId, followedType, status: "active" },
    });

    // Extract followerIds from the UserFollowers results
    const followerIds = followers.map((follower) => follower.followerId);

    // Fetch User records for the followerIds
    const users = await User.findAll({
      where: { id: followerIds },
      attributes: ["id", "username", "picture"], // Select only necessary fields
    });

    // Map the results to include User data and followedAt
    const result = followers.map((follower) => {
      const user = users.find((u) => u.id === follower.followerId);
      return {
        id: user.id,
        username: user.username,
        picture: user.picture,
        followedAt: follower.followedAt,
      };
    });

    return result;
  }

  // static async getFollowers(userId) {
  //     // const offset = (page - 1) * limit;

  //     return await User.findOne({
  //     where: { id: userId },
  //     include: [
  //         {
  //         model: User,
  //         as: "Followers",
  //         through: { where: { status: "active" } },
  //         attributes: ["id", "username", "picture"],
  //         // limit,
  //         // offset,
  //         },
  //     ],
  //     });
  // }

  static async getFollowing(userId) {
    // const offset = (page - 1) * limit;

    return User.findOne({
      where: { id: userId },
      include: [
        {
          model: User,
          as: "Following",
          through: { where: { status: "active" } },
          attributes: ["id", "username", "picture"],
          // limit,
          // offset,
        },
      ],
    });
  }

  static async getUserNotifications(userId) {
    // const offset = (page - 1) * limit;

    return Notification.findAndCountAll({
      where: { recipientId: userId },
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["id", "username", "picture"],
        },
      ],
      order: [["createdAt", "DESC"]],
      // limit,
      // offset
    });
  }

  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        recipientId: userId,
        read: false,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await notification.update({ read: true });
    return notification;
  }

  static async markAllAsRead(userId) {
    return Notification.update(
      { read: true },
      {
        where: {
          recipientId: userId,
          read: false,
        },
      }
    );
  }
  // Add follower to user
  // static async addFollower(userId, followerId) {
  //     try {
  //         const user = await User.findByPk(userId);
  //         const follower = await User.findByPk(followerId);

  //         if (!user || !follower) return false;

  //         // Add follower to the user's followers
  //         await user.addFollower(follower);

  //         // Notification for the user being followed
  //         await Notification.create({
  //             userId: userId, // The user being followed
  //             followerId: follower.id, // The follower
  //             notificationType: 'followed', // Indicates the type of notification
  //             message: `${user.username} started following you.`,
  //         });

  //         // Notification for the follower who started following someone
  //         await Notification.create({
  //             userId: follower.id, // The follower
  //             followerId: user.id, // The user being followed
  //             notificationType: 'following', // Indicates the type of notification
  //             message: `You started following ${follower.username}.`,
  //         });

  //         return user;
  //     } catch (error) {
  //         throw new Error(`Error adding follower: ${error.message}`);
  //     }
  // }

  // // Remove follower from user
  // static async removeFollower(userId, followerId) {
  //     try {
  //         // Find both users
  //         const user = await User.findByPk(userId);
  //         const follower = await User.findByPk(followerId);

  //         if (!user || !follower) return false;

  //         // Remove the follower relationship
  //         await user.removeFollower(follower);

  //         // Remove the initial "followed" notification, if it exists
  //         const followNotification = await Notification.findOne({
  //             where: {
  //                 userId: userId,
  //                 followerId: follower.id,
  //                 notificationType: 'followed',
  //             },
  //         });
  //         if (followNotification) {
  //             await followNotification.destroy(); // Delete the "followed" notification
  //         }

  //         // Create a new "unfollow" notification
  //         await Notification.create({
  //             userId: userId, // The user being unfollowed
  //             followerId: follower.id, // The user who unfollowed
  //             notificationType: 'unfollowed', // A new type for "unfollowed"
  //             message: `${user.username} unfollowed you.`,
  //         });

  //         // Return the user who was unfollowed
  //         return user;
  //     } catch (error) {
  //         throw new Error(`Error removing follower: ${error.message}`);
  //     }
  // }

  // // Get notifications for user
  // static async getNotifications(userId) {
  //     try {
  //         const notification = await Notification.findAll({ where: { followerId: userId } });
  //         if (!notification) return false;
  //         return notification;
  //     } catch (error) {
  //         throw new Error(`Error retrieving notifications: ${error.message}`);
  //     }
  // }

  // // Mark notification as read
  // static async markNotificationAsRead(notificationId) {
  //     try {
  //         const notification = await Notification.findByPk(notificationId);
  //         if (!notification) return false;
  //         notification.read = true;
  //         await notification.save();
  //         return notification;
  //     } catch (error) {
  //         throw new Error(`Error marking notification as read: ${error.message}`);
  //     }
  // }

  // // Get user and their followers
  // static async getUserWithFollowers(userId) {
  //     try {
  //         const user = await User.findByPk(userId, {
  //             include: {
  //                 model: User,
  //                 as: 'Followers',
  //                 attributes: ['id', 'username', 'email'],
  //                 through: { attributes: [] },
  //             },
  //         });

  //         if (!user) return false;
  //         return user;
  //     } catch (error) {
  //         throw new Error(`Error fetching user with followers: ${error.message}`);
  //     }
  // };

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
