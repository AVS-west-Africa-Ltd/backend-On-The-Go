const { Business } = require("../models");
const User = require("../models/User");

class BusinessService {
  // Get user by ID
  static async getAllBusinesses() {
    try {
      const users = await User.findAll({
        where: { userType: "business" },
        include: [
          {
            model: Business,
          },
        ],
      });

      if (!users) return false;

      // Parse JSON strings into objects for each user and their businesses
      const parsedUsers = users.map((user) => {
        const parsedBusinesses = user.Businesses.map((business) => ({
          ...business.toJSON(),
          amenities: JSON.parse(business.amenities),
          hours: JSON.parse(business.hours),
          social: JSON.parse(business.social),
          wifi: JSON.parse(business.wifi),
        }));

        return {
          ...user.toJSON(),
          Businesses: parsedBusinesses,
        };
      });

      return parsedUsers;
    } catch (error) {
      throw new Error("Error fetching user: " + error.message);
    }
  }

  static async getBusinessById(userId) {
    try {
      // Find the user by primary key (userId) and include their associated Businesses
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Business, // Include the associated Business model
          },
        ],
      });

      // If no user is found, return null or an appropriate response
      if (!user) return null;

      // Parse JSON strings into objects for the user's businesses
      const parsedBusinesses = user.Businesses.map((business) => ({
        ...business.toJSON(),
        amenities: JSON.parse(business.amenities),
        hours: JSON.parse(business.hours),
        social: JSON.parse(business.social),
        wifi: JSON.parse(business.wifi),
      }));

      // Return the user with parsed businesses
      return {
        ...user.toJSON(),
        Businesses: parsedBusinesses,
      };
    } catch (error) {
      throw new Error("Error fetching user: " + error.message);
    }
  }
}

module.exports = BusinessService;
