require("dotenv").config();

const Business = require("../models/Business");
const { BusinessPosts } = require("../models/index");
const BusinessService = require("../services/BusinessService");
const { uploadGenericFiles } = require("../utils/upload");

const businessController = {
  // Create a new Business
  createBusiness: async (req, res) => {
    try {
      // First handle the file uploads
      await new Promise((resolve, reject) => {
        uploadGenericFiles.fields([
          { name: "logo", maxCount: 1 },
          { name: "cacDoc", maxCount: 1 },
        ])(req, res, (err) => {
          if (err) {
            console.error("Error uploading files:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const {
        userId,
        name,
        type,
        address,
        description,
        amenities,
        hours,
        social,
        wifi,
      } = req.body;

      // Extract file URLs from S3
      const logoUrl = req.files?.logo?.[0]?.location || null;
      const cacDocUrl = req.files?.cacDoc?.[0]?.location || null;

      // Parse JSON strings if they exist
      const socialArray = social ? JSON.parse(social) : null;
      const wifiArray = wifi ? JSON.parse(wifi) : null;
      const hoursArray = hours ? JSON.parse(hours) : null;
      const amenitiesArray = amenities ? JSON.parse(amenities) : null;

      // Create the business
      const business = await Business.create({
        userId,
        name,
        type,
        address,
        description,
        logo: logoUrl,
        amenities: amenitiesArray,
        cacDoc: cacDocUrl,
        hours: hoursArray,
        social: socialArray,
        wifi: wifiArray,
      });

      res.status(201).json({
        message: "Business created successfully",
        data: business,
      });
    } catch (error) {
      console.error("Error creating business:", error);
      const statusCode = error.message.includes("upload") ? 400 : 500;
      res.status(statusCode).json({
        message: "Error creating business",
        error: error.message,
      });
    }
  },

  // Get all Businesses
  getAllBusinesses: async (req, res) => {
    try {
      const businesses = await BusinessService.getAllBusinesses();

      return res.status(200).json({
        businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get all Businesses
  getAllBusiness: async (req, res) => {
    try {
      const businesses = await BusinessService.getAllBusiness();

      return res.status(200).json(businesses);
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get a user business
  getBusinessByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const business = await BusinessService.getBusinessByUserId(userId);

      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }

      return res.status(200).json(business);
    } catch (error) {
      // console.error("Error fetching user's businesses:", error);
      res.status(500).json(error.message);
    }
  },
  // Get a user business
  getBusinessById: async (req, res) => {
    try {
      const { businessId } = req.params;
      const business = await BusinessService.getBusinessById(businessId);

      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }

      return res.status(200).json(business);
    } catch (error) {
      // console.error("Error fetching user's businesses:", error);
      res.status(500).json(error.message);
    }
  },

  // Get a single Business by ID
  // getBusinessById: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     const business = await Business.findByPk(id);
  //     if (!business) {
  //       return res.status(404).json({
  //         message: "Business not found",
  //       });
  //     }
  //     return res.status(200).json({
  //       message: "Business retrieved successfully",
  //       data: business,
  //     });
  //   } catch (error) {
  //     return res.status(500).json({
  //       message: "Failed to retrieve business",
  //       error: error.message,
  //     });
  //   }
  // },

  // Update a Business
  updateBusiness: async (req, res) => {
    try {
      // First handle the file uploads
      await new Promise((resolve, reject) => {
        uploadGenericFiles.fields([
          { name: "logo", maxCount: 1 },
          { name: "cacDoc", maxCount: 1 },
        ])(req, res, (err) => {
          if (err) {
            console.error("File upload error:", err);
            reject(new Error(`File upload failed: ${err.message}`));
          } else {
            resolve();
          }
        });
      });

      const { id } = req.params;
      const {
        name,
        type,
        address,
        description,
        amenities,
        hours,
        social,
        wifi,
      } = req.body;

      // Find the business to update
      const business = await Business.findByPk(id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Prepare update data
      const updateData = {
        name: name || business.name,
        type: type || business.type,
        address: address || business.address,
        description: description || business.description,
        logo: req.files?.logo?.[0]?.location || business.logo,
        cacDoc: req.files?.cacDoc?.[0]?.location || business.cacDoc,
        amenities: amenities ? JSON.parse(amenities) : business.amenities,
        hours: hours ? JSON.parse(hours) : business.hours,
        social: social ? JSON.parse(social) : business.social,
        wifi: wifi ? JSON.parse(wifi) : business.wifi,
      };

      // Update business
      await business.update(updateData);

      // Format response data
      const formatJsonField = (field) =>
        typeof field === "string" ? JSON.parse(field) : field;

      const responseData = {
        ...business.toJSON(),
        social: formatJsonField(business.social),
        wifi: formatJsonField(business.wifi),
        amenities: formatJsonField(business.amenities),
        hours: formatJsonField(business.hours),
      };

      res.status(200).json({
        message: "Business updated successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("Error in updateBusiness:", error);
      const statusCode = error.message.includes("upload") ? 400 : 500;
      res.status(statusCode).json({
        message: "Error updating business",
        error: error.message.replace("File upload failed: ", ""),
      });
    }
  },

  getBusinessPosts: async (req, res) => {
    const { businessId } = req.params;

    try {
      // Query the Business table with its related posts
      const business = await Business.findByPk(businessId, {
        attributes: ["id", "name", "type", "logo"],
        include: {
          model: BusinessPosts,
          as: "BusinessPosts",
          attributes: ["id", "media", "postText", "createdAt"],
        },
      });

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.status(200).json({
        message: "Business info with posts retrieved successfully",
        business,
      });
    } catch (error) {
      console.error("Error retrieving business info with posts:", error);
      res.status(500).json({
        message: "Error retrieving business info with posts",
        error: error.message,
      });
    }
  },

  addWifiScanner: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { userId, location, wifiName } = req.body;

      // Validate inputs
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const user = await BusinessService.addWifiScanner(
        userId,
        businessId,
        location,
        wifiName
      );
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(201).json({ message: user.message, user: user.data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getAllWifiScan: async (req, res) => {
    try {
      const { businessId } = req.params;
      const wifiScanners = await BusinessService.getAllWifiScan(businessId);
      if (!wifiScanners)
        return res.status(404).json({ message: "No record found" });
      return res.status(200).json({ wifiScanners });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getAllRepeatedCustomers: async (req, res) => {
    try {
      const { businessId } = req.params;
      const wifiScanners = await BusinessService.getAllRepeatedCustomers(
        businessId
      );
      if (!wifiScanners)
        return res.status(404).json({ message: "No record found" });
      return res.status(200).json({ wifiScanners });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // business.controller.js
  filterBusinesses: async (req, res) => {
    try {
      // Extract all possible filter parameters
      const filters = {
        wifi: req.query.wifi === "true",
        parkingSpace: req.query.parkingSpace === "true",
        airConditioning: req.query.airConditioning === "true",
        petFriendly: req.query.petFriendly === "true",
        // Add more as needed
      };

      // Use the appropriate service method based on your database
      const businesses = await BusinessService.filterBusinessesAlt(filters);

      return res.status(200).json({
        businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to filter businesses",
        error: error.message,
      });
    }
  },

  searchBusinessesByName: async (req, res) => {
    try {
      const searchTerm = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!searchTerm) {
        return res.status(400).json({
          message: "Search term is required",
          error: "Missing 'q' parameter",
        });
      }

      const { businesses, total } =
        await BusinessService.searchBusinessesByName(searchTerm, page, limit);

      return res.status(200).json({
        count: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to search businesses",
        error: error.message,
      });
    }
  },
};

module.exports = businessController;
