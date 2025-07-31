require("dotenv").config();
const { Business, BusinessPosts } = require('../models');
const BusinessService = require("../services/BusinessService");
const { uploadGenericFiles } = require("../utils/upload");
const { Op } = require('sequelize');

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
        latitude,
        longitude
      } = req.body;

      // Extract file URLs from S3
      const logoUrl = req.files?.logo?.[0]?.location || null;
      const cacDocUrl = req.files?.cacDoc?.[0]?.location || null;

      // Parse JSON strings if they exist
      const socialArray = social ;
      const wifiArray = wifi;
      const hoursArray = hours ;
      const amenitiesArray = amenities;

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
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
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
    const { offset } = req.query;
    try {
      const businesses = await BusinessService.getAllBusinesses(offset);

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
    const { offset } = req.query;
    try {
    
      const businesses = await BusinessService.getAllBusiness(offset);

      return res.status(200).json(businesses);
    } catch (error) {
      console.error("❌ Error retrieving businesses:", error);

      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get all Defibrillator
  getAllDefibrillator: async (req, res) => {
    try {
      const defibrillators = await BusinessService.getAllDefibrillator();

      return res.status(200).json(defibrillators);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Failed to retrieve defibrillators",
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

  updateBusiness: async (req, res) => {
    try {
      console.log("➡️ updateBusiness called");
      console.log("📝 Params:", req.params);
      console.log("📝 Body before file processing:", req.body);

      await new Promise((resolve, reject) => {
        uploadGenericFiles.fields([])(req, res, (err) => {
          if (err) {
            console.error("❌ File upload error:", err);
            reject(new Error(`File upload failed: ${err.message}`));
          } else {
            console.log("✅ File upload completed successfully.");
            console.log("📎 Uploaded Files:", req.files);
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
        wifiPlans,
        bankName,
        accountName,
        accountNumber
      } = req.body;

      console.log("🔍 Fetching business by ID:", id);
      const business = await Business.findByPk(id);

      if (!business) {
        console.warn("⚠️ Business not found with ID:", id);
        return res.status(404).json({ message: "Business not found" });
      }

      // Parse amenities safely
      let parsedAmenities = business.amenities; // default to existing
      if (amenities) {
        try {
          parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        } catch (e) {
          console.error("❌ Error parsing amenities:", e);
          parsedAmenities = business.amenities; // fallback to existing
        }
      }


      // Check if any bank detail is being uploaded or changed
      const bankDetailsChanged =
        (bankName && bankName !== business.bankName) ||
        (accountName && accountName !== business.accountName) ||
        (accountNumber && accountNumber !== business.accountNumber);

      const updateData = {
        name: name || business.name,
        type: type || business.type,
        address: address || business.address,
        description: description || business.description,
        logo: req.files?.logo?.[0]?.location || business.logo,
        cacDoc: req.files?.cacDoc?.[0]?.location || business.cacDoc,
        amenities: parsedAmenities,
        hours: hours ? JSON.parse(hours) : business.hours,
        social: social ? JSON.parse(social) : business.social,
        wifi: wifi ? JSON.parse(wifi) : business.wifi,
        wifiPlans: wifiPlans ? JSON.parse(wifiPlans) : business.wifiPlans,
        bankName: bankName === "" ? null : (bankName || business.bankName),
        accountName: accountName === "" ? null : (accountName || business.accountName),
        accountNumber: accountNumber === "" ? null : (accountNumber || business.accountNumber),
      };

      if (bankDetailsChanged) {
        updateData.splitCode = null;
        console.log("🔄 Bank details changed — splitCode cleared.");
      }

      console.log("🛠️ Update Data Prepared:", updateData);

      await business.update(updateData);
      console.log("✅ Business updated successfully.");

      const formatJsonField = (field) =>
        typeof field === "string" ? JSON.parse(field) : field;

      const responseData = {
        ...business.toJSON(),
        social: business.social,
        wifi: business.wifi,
        wifiPlans: business.wifiPlans,
        amenities: business.amenities,
        hours: business.hours,
      };

      console.log("📦 Final Response Data:", responseData);

      res.status(200).json({
        message: "Business updated successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("🔥 Error in updateBusiness:", error);
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

  searchBusinessesName: async (req, res) => {
    try {
      const { searchTerm } = req.query;
      const businesses = await Business.findAll({ where:{ 
          name: { [Op.like]: `%${searchTerm}%` }
        },
      });
      return res.status(200).json({ businesses, message: "Businesses fetched "});

    } catch (error) {
      return res.status(500).json({
        message: "Failed to search businesses",
        error: error.message,
      });
    }
  },

  searchBusinessesByLocation: async (req, res) => {
    
    const { latitude, longitude } = req.query;
      try {

        const businesses = await BusinessService.searchBusinessbyLocation(latitude, longitude);

        if (!businesses) return res.status(404).json({ message: "No record found" });

        return res.status(200).json({ businesses });

      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
  }

};

module.exports = businessController;
