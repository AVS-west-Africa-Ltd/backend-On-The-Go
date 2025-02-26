const { Business, BusinessPosts, BusinessFollowers } = require("../models");

class BusinessService {
  static async createBusiness(payload) {
    try {
      return await Business.create(payload);
    } catch (error) {
      throw new Error("Error creating business");
    }
  }

  static async getAllBusinesses() {
    try {
      return await Business.findAll();
    } catch (error) {
      throw new Error("Failed to retrieve businesses");
    }
  }

  static async getUserBusinesses(userId) {
    try {
      return await Business.findOne({ where: { userId: userId } });
    } catch (error) {
      throw new Error("Error fetching user's businesses");
    }
  }

  static async getBusinessById(id) {
    try {
      return await Business.findByPk(id);
    } catch (error) {
      throw new Error("Failed to retrieve business");
    }
  }

  static async updateBusiness(business) {
    try {
      return await business.save();
    } catch (error) {
      throw new Error("Error updating business");
    }
  }

  static async deleteBusiness(id) {
    try {
      const business = await Business.findByPk(id);
      if (business) {
        await business.destroy();
        return true;
      }
      return false;
    } catch (error) {
      throw new Error("Failed to delete business");
    }
  }

  static async getBusinessPosts(businessId) {
    try {
      return await Business.findByPk(businessId, {
        include: {
          model: BusinessPosts,
          as: "BusinessPosts",
        },
      });
    } catch (error) {
      throw new Error("Error retrieving business posts");
    }
  }

  static async toggleFollow(followerId, followedId) {
    try {
      const existingFollow = await BusinessFollowers.findOne({
        where: { followerId, followedId },
      });

      if (existingFollow) {
        await existingFollow.destroy();
        return false; // Unfollowed
      } else {
        await BusinessFollowers.create({ followerId, followedId });
        return true; // Followed
      }
    } catch (error) {
      throw new Error("An error occurred while toggling follow");
    }
  }

  static async getFollowing(businessId) {
    try {
      const business = await Business.findByPk(businessId);
      return await business.getFollowing();
    } catch (error) {
      throw new Error("An error occurred while fetching following businesses");
    }
  }
}

module.exports = BusinessService;
