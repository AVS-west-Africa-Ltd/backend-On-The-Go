const { Business, RepeatedCustomer, User, WifiScan, TicketProfile } = require("../models");
const { Op } = require("sequelize");
const { getBoundingBox } = require("../helpers");

class BusinessService {
  // Get user by ID
  static async getAllBusinesses(offset) {
    try {
      const users = await User.findAll({
        where: { userType: "business" },
        include: [
          {
            model: Business,
          },
        ],
        limit: 30,
        offset: Number(offset) || 0
      });

      if (!users) return false;

      const parsedUsers = users.map((user) => {
        const parsedBusinesses = user.Businesses.map((business) => {
          const raw = business.toJSON();

          return {
            ...raw,
            amenities: raw.amenities,
            hours: raw.hours,
            social: raw.social,
            wifi: raw.wifi,
            wifiPlans: raw.wifiPlans, // Optional: include if needed
          };
        });

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

  static async getAllBusiness(offset) {
    try {
      const businesses = await Business.findAll({limit: 30, offset: Number(offset) || 0});

      if (!businesses || businesses.length === 0) return false;

      return businesses;
    } catch (error) {
      console.error("❌ Error in getAllBusiness:", error);
      throw new Error("Error fetching businesses: " + error.message);
    }
  }

  static async getAllDefibrillator() {
    try {
      const businesses = await Business.findAll({
        where: { type: "defibrillator" },
      });
      if (!businesses || businesses.length === 0) return false;
      return businesses;
    } catch (error) {
      throw new Error("Error fetching businesses: " + error.message);
    }
  }

  static async getBusinessByUserId(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [ { model: Business }, { model: TicketProfile } ],
      });

      if (!user) return null;

      const parsedBusinesses = user.Businesses.map((business) => ({
        ...business.toJSON(),
        amenities: business.amenities,
        hours: business.hours,
        social: business.social,
        wifi: business.wifi,
      }));


      return {
        ...user.toJSON(),
        Businesses: parsedBusinesses,
      };
    } catch (error) {
      throw new Error("Error fetching user: " + error.message);
    }
  }

  static async getBusinessById(businessId) {
    try {
      const business = await Business.findByPk(businessId);
      if (!business) return null;
      const ticketProfile = await TicketProfile.findAll({ where: {userId: business.userId }});
      return {
        ...business.toJSON(),
        ticketProfile: ticketProfile
      };
    } catch (error) {
      throw new Error("Error fetching user: " + error.message);
    }
  }

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

  // Alternative for databases without JSON contains support
  static async filterBusinessesAlt(filters = {}) {
    const allBusinesses = await Business.findAll();

    // Parse and filter businesses
    const filteredBusinesses = allBusinesses.filter((business) => {
      let amenities = [];
      try {
        amenities = JSON.parse(business.amenities || "[]");
      } catch (e) {
        console.error("Invalid amenities JSON:", business.amenities);
        return false;
      }

      const normalizedAmenities = amenities.map((amenity) =>
        amenity.toString().toLowerCase().trim()
      );

      if (filters.wifi && !normalizedAmenities.includes("wifi")) return false;
      if (
        filters.parkingSpace &&
        !normalizedAmenities.includes("parking space")
      )
        return false;
      if (
        filters.airConditioning &&
        !normalizedAmenities.includes("air conditioning")
      )
        return false;
      if (filters.petFriendly && !normalizedAmenities.includes("pet friendly"))
        return false;

      return true;
    });

    // 4. Remove escape characters from the response
    const cleanBusinesses = filteredBusinesses.map((business) => ({
      ...business.get({ plain: true }),
      amenities: JSON.parse(business.amenities), // Properly parsed array
      hours: JSON.parse(business.hours),
      social: JSON.parse(business.social),
      wifi: JSON.parse(business.wifi),
    }));

    return {
      count: cleanBusinesses.length,
      businesses: cleanBusinesses,
    };
  }

  static async searchBusinessesByName(searchTerm, limit = 100) {
    try {
      const businesses = await Business.findAll({
        where: {
          name: {
            [Op.like]: `%${searchTerm}%`, 
          },
        },
        limit: parseInt(limit),
        order: [["name", "ASC"]],
      });

      // Parse all JSON string fields
      return businesses.map((business) => {
        const parsedBusiness = business.get({ plain: true });

        // Parse all stringified JSON fields
        const jsonFields = ["amenities", "hours", "social", "wifi"];
        jsonFields.forEach((field) => {
          try {
            parsedBusiness[field] = parsedBusiness[field]
              ? JSON.parse(parsedBusiness[field])
              : null;
          } catch (e) {
            console.error(`Error parsing ${field}:`, e);
            parsedBusiness[field] = null;
          }
        });

        return parsedBusiness;
      });
    } catch (error) {
      console.error("Search error:", error);
      throw new Error("Business search failed");
    }
  }

  static async searchBusinessesByName(searchTerm, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await Business.findAndCountAll({
        where: {
          name: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
        limit: parseInt(limit),
        offset: offset,
        order: [["name", "ASC"]],
      });

      const businesses = rows.map((business) => {
        const parsedBusiness = business.get({ plain: true });
        const jsonFields = ["amenities", "hours", "social", "wifi"];
        jsonFields.forEach((field) => {
          try {
            parsedBusiness[field] = parsedBusiness[field]
              ? JSON.parse(parsedBusiness[field])
              : null;
          } catch (e) {
            console.error(`Error parsing ${field}:`, e);
            parsedBusiness[field] = null;
          }
        });

        return parsedBusiness;
      });

      return {
        businesses,
        total: count,
      };
    } catch (error) {
      console.error("Search error:", error);
      throw new Error("Business search failed");
    }
  }  

  static async searchBusinessbyLocation( latitude, longitude ) {

    const box = getBoundingBox(Number(latitude), Number(longitude), 10);

    const businesses = await Business.findAll({
      where: {
        latitude: { [Op.between]: [box.minLat, box.maxLat] },
        longitude: { [Op.between]: [box.minLng, box.maxLng] }
      },
      limit: 40
    });

    return businesses;
  }

}

module.exports = BusinessService;
