const {
  User,
  UserFollower,
  Notification,
  Comment,
  Post,
  WifiScan,
  RepeatedCustomer,
  sequelize
} = require("../models");

class UserService {
  // In your UserService
  static async createUser(data) {
    try {
      return await User.create(data);
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        const errors = error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        }));
        throw { status: 400, errors };
      }
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) return false;

      // Convert Sequelize instance to plain object
      const userData = user.get({ plain: true });

      // Safely parse JSON fields with proper error handling
      const parseJsonField = (field) => {
        try {
          return field
            ? typeof field === "string"
              ? JSON.parse(field)
              : field
            : [];
        } catch (e) {
          return [];
        }
      };

      return {
        ...userData,
        interests: parseJsonField(userData.interests),
        placesVisited: parseJsonField(userData.placesVisited),
      };
    } catch (error) {
      console.error("Error in getUserById:", error);
      throw new Error("Error fetching user details");
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

  static async getUsers(props) {
    try {
      const users = await User.findAll(props || {});

      // Convert Sequelize instances to plain objects and parse JSON fields
      return users.map((user) => {
        const userData = user.toJSON();
        return {
          ...userData,
          interests: userData.interests,
          placesVisited: userData.placesVisited,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  // Update user information
  static async updateUser(userId, data) {
    const transaction = await sequelize.transaction();
    try {
      console.log(`[UserService] Updating user ${userId} with data:`, data);

      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        throw new Error(`User with ID ${userId} not found`);
      }

      // Handle JSON fields if they exist in the data
      if (data.interests && typeof data.interests === "string") {
        try {
          data.interests = JSON.parse(data.interests);
        } catch (e) {
          await transaction.rollback();
          throw new Error("Invalid interests format. Must be valid JSON");
        }
      }

      if (data.placesVisited && typeof data.placesVisited === "string") {
        try {
          data.placesVisited = JSON.parse(data.placesVisited);
        } catch (e) {
          await transaction.rollback();
          throw new Error("Invalid placesVisited format. Must be valid JSON");
        }
      }

      const updatedUser = await user.update(data, { transaction });
      await transaction.commit();

      console.log(`[UserService] Successfully updated user ${userId}`);
      return updatedUser;
    } catch (error) {
      await transaction.rollback();
      console.error(`[UserService] Error updating user ${userId}:`, error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
  // Delete a user
  static async deleteUser(userId) {
    // Get the sequelize instance from your User model
    const transaction = await User.sequelize.transaction();

    try {
      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        await transaction.rollback();
        return false;
      }

      // Delete all dependent records first
      await Comment.destroy({
        where: { authorId: userId },
        transaction,
      });

      await UserFollower.destroy({
        where: { followerId: userId },
        transaction,
      });

      await Post.destroy({ where: { userId }, transaction });
      await WifiScan.destroy({ where: { userId }, transaction });
      await RepeatedCustomer.destroy({
        where: { wifiScanId: userId },
        transaction,
      });

      // Then delete the user
      await user.destroy({ transaction });

      // Commit the transaction if everything succeeded
      await transaction.commit();
      return true;
    } catch (error) {
      // Rollback if any error occurs
      await transaction.rollback();
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  static async followUser(followerId, followedId) {
    const transaction = await sequelize.transaction();

    try {
      // Check if users exist and are different
      if (followerId === followedId) {
        throw new Error("Users cannot follow themselves");
      }

      const [follower, followed] = await Promise.all([
        User.findByPk(followerId),
        User.findByPk(followedId),
      ]);

      if (!follower || !followed) {
        throw new Error("One or both users not found");
      }

      // Find any existing follow relationship regardless of status
      const existingFollow = await UserFollower.findOne({
        where: {
          followerId,
          followedId,
        },
      });

      if (existingFollow) {
        if (existingFollow.status === "active") {
          return { success: true };
        }
        // Update existing record instead of creating new one
        await existingFollow.update(
          {
            status: "active",
          },
          { transaction }
        );
      } else {
        // Create new follow relationship
        await UserFollower.create(
          {
            followerId,
            followedId,
            status: "active",
          },
          { transaction }
        );
      }

      // Update follower counts
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

      // Create notification
      const notification = await Notification.create(
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

      await transaction.commit();
      return { success: true, notification };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async unfollowUser(followerId, followedId) {
    const transaction = await sequelize.transaction();

    try {
      const follow = await UserFollower.findOne({
        where: {
          followerId,
          followedId,
          status: "active",
        },
      });

      if (!follow) {
        throw new Error("Follow relationship not found");
      }

      // Update follow status
      await follow.update({ status: "blocked" }, { transaction });

      // Update follower counts
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

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getFollowers(userId) {
    const result = await User.findOne({
      where: { id: userId },
      include: [
        {
          model: User,
          as: "Followers",
          through: { where: { status: "active" } },
          attributes: [
            "id",
            "username",
            "picture",
            "profession",
            "skills",
            "gender",
            "location",
            "placesVisited",
            "interests",
          ],
        },
      ],
      attributes: {
        exclude: [
          "password",
          "resetPasswordOTP",
          "resetPasswordExpires",
          "pushToken",
        ],
      },
    });

    if (!result) return null;

    // Convert to plain object and parse JSON fields
    const followersData = result.get({ plain: true });

    // Process each follower
    followersData.Followers = followersData.Followers.map((follower) => {
      // Parse JSON strings to arrays
      if (follower.placesVisited) {
        try {
          follower.placesVisited = JSON.parse(follower.placesVisited);
        } catch (e) {
          follower.placesVisited = [];
        }
      } else {
        follower.placesVisited = [];
      }

      if (follower.interests) {
        try {
          follower.interests = JSON.parse(follower.interests);
        } catch (e) {
          follower.interests = [];
        }
      } else {
        follower.interests = [];
      }

      return follower;
    });

    return followersData;
  }

  static async getFollowing(userId) {
    // const offset = (page - 1) * limit;

    return User.findOne({
      where: { id: userId },
      include: [
        {
          model: User,
          as: "Following",
          through: { where: { status: "active" } },
          attributes: [
            "id",
            "username",
            "picture",
            "profession",
            "skills",
            "gender",
            "location",
            "placesVisited",
            "interests",
          ],
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
