const { Business } = require("../models");
const RepeatedCustomer = require("../models/RepeatedCustomers");
const User = require("../models/User");
const WifiScan = require("../models/WifiScan");

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

  // static async getAllBusiness() {
  //   try {
  //     // Fetch all businesses
  //     const businesses = await Business.findAll();

  //     // If no businesses are found, return false
  //     if (!businesses || businesses.length === 0) return false;

  //     // Parse JSON strings into objects for each business
  //     const parsedBusinesses = businesses.map((business) => {
  //       // Parse the JSON fields if they exist
  //       const amenities = business.amenities
  //         ? JSON.parse(business.amenities)
  //         : null;
  //       const hours = business.hours ? JSON.parse(business.hours) : null;
  //       const social = business.social ? JSON.parse(business.social) : null;
  //       const wifi = business.wifi ? JSON.parse(business.wifi) : null;

  //       // Return the business object with parsed fields
  //       return {
  //         ...business.toJSON(),
  //         amenities,
  //         hours,
  //         social,
  //         wifi,
  //       };
  //     });

  //     // Return the parsed businesses
  //     return parsedBusinesses;
  //   } catch (error) {
  //     throw new Error("Error fetching businesses: " + error.message);
  //   }
  // }

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

  // static async addWifiScanner(userId, businessId, location,wifiName) {
  //   try {
  //     // Look for an existing first-time scan for the user
  //     const existingScan = await WifiScan.findOne({
  //       where: { businessId },
  //     });

  //     if (!existingScan) {
  //       // First time scan: create a record in WifiScan
  //       return await WifiScan.create({ userId, businessId, location,wifiName });
  //     } else {
  //       return await RepeatedCustomer.create({
  //         wifiScanId: existingScan.id, // Linking to the first scan record
  //         businessId,
  //         location,
  //       });
  //     }
  //   } catch (error) {
  //     throw new Error(`Error in addWifiScanner: ${error.message}`);
  //   }
  // }

  static async addWifiScanner(userId, businessId, location, wifiName) {
    try {
      if (!userId) {
        throw new Error("userId is missing or null");
      }

      // Ensure location is a proper JSON object
      const parsedLocation =
        typeof location === "string" ? JSON.parse(location) : location;

      // Look for an existing first-time scan for the user
      const existingScan = await WifiScan.findOne({
        where: { userId },
      });

      if (!existingScan) {
        // First-time scan: create a record in WifiScan
        const newWifiScan = await WifiScan.create({
          userId,
          businessId,
          location: parsedLocation,
          wifiName,
        });
        return {
          message: "WiFi scan added successfully",
          data: newWifiScan,
        };
      } else {
        // User already scanned before, add to RepeatedCustomer
        const repeatedScan = await RepeatedCustomer.create({
          wifiScanId: existingScan.id, // Linking to the first scan record
          businessId,
          location: parsedLocation,
          wifiName,
          userId,
        });
        return {
          message: "Repeated scan recorded successfully",
          data: repeatedScan,
        };
      }
    } catch (error) {
      throw new Error(`Error in addWifiScanner: ${error.message}`);
    }
  }

  static async getAllWifiScan(businessId) {
    try {
      // Retrieve all Wi-Fi scans for the specific business
      const wifiScans = await WifiScan.findAll({
        where: { businessId },
      });

      // Extract unique userIds from the Wi-Fi scans
      const userIds = [...new Set(wifiScans.map((scan) => scan.userId))];

      // Fetch user details for the extracted userIds
      const users = await User.findAll({ where: { id: userIds } });

      // Combine Wi-Fi scan data with user details
      const wifiScansWithUserInfo = wifiScans.map((scan) => {
        const user = users.find((user) => user.id === scan.userId);

        // Parse the location field if it's a string
        const location =
          typeof scan.location === "string"
            ? JSON.parse(scan.location)
            : scan.location;

        return {
          ...scan.toJSON(), // Include all Wi-Fi scan data
          location, // Add the parsed location
          user, // Add the corresponding user details
        };
      });

      return wifiScansWithUserInfo;
    } catch (error) {
      throw new Error(
        `Error retrieving WifiScan data with user info: ${error.message}`
      );
    }
  }

  static async getAllRepeatedCustomers(businessId) {
    try {
      const repeatedCustomers = await RepeatedCustomer.findAll({
        where: { businessId },
      });

      const userIds = repeatedCustomers.map((customer) => customer.userId);

      const users = await User.findAll({ where: { id: userIds } });

      const repeatedCustomersWithUserInfo = repeatedCustomers.map(
        (customer) => {
          const user = users.find((user) => user.id === customer.userId);

          // Parse the location field if it's a string
          const location =
            typeof customer.location === "string"
              ? JSON.parse(customer.location)
              : customer.location;
          return {
            ...customer.toJSON(),
            location, // Add the parsed location
            user,
          };
        }
      );

      return repeatedCustomersWithUserInfo;
    } catch (error) {
      throw new Error(
        `Error retrieving RepeatedCustomer data with user info: ${error.message}`
      );
    }
  }
}

module.exports = BusinessService;
