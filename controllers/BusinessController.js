require("dotenv").config();
const multer = require("multer");
// const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");

const Business = require("../models/Business");
const { BusinessPosts, BusinessFollowers } = require("../models/index");
const BusinessService = require("../services/BusinessService");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
// gh
// gh

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `business/${Date.now()}-${file.originalname}`);
    },
  }),
});

const businessController = {
  // Create a new Business
  createBusiness: async (req, res) => {
    console.log("Request Body:", req.body);
    const uploadHandler = upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "cacDoc", maxCount: 1 },
    ]);

    uploadHandler(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res
          .status(501)
          .json({ message: "Error uploading files", error: err.message });
      }

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

      try {
        // Extract file URLs from S3
        const logoUrl = req.files.logo ? req.files.logo[0].location : null;
        const cacDocUrl = req.files.cacDoc
          ? req.files.cacDoc[0].location
          : null;

        const socialArray = social ? JSON.parse(social) : null;
        const wifiArray = wifi ? JSON.parse(wifi) : null;
        const hoursArray = hours ? JSON.parse(hours) : null;
        const amenitiesArray = amenities ? JSON.parse(amenities) : null;

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
        res.status(500).json({
          message: "Error creating business",
          error: error.message,
        });
      }
    });
  },

  // Get all Businesses
  getAllBusinesses: async (req, res) => {
    try {
      const businesses = await BusinessService.getAllBusinesses();

      return res.status(200).json({
        message: "Businesses retrieved successfully",
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

      return res.status(200).json({
        message: "Businesses retrieved successfully",
        businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get a user business

  getBusinessById: async (req, res) => {
    try {
      const { userId } = req.params;
      const business = await BusinessService.getBusinessById(userId);

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
    const uploadHandler = upload.fields([
      { name: "logo", maxCount: 1 },
      { name: "cacDoc", maxCount: 1 },
    ]);

    uploadHandler(req, res, async (err) => {
      if (err) {
        console.error("Error uploading files:", err);
        return res
          .status(501)
          .json({ message: "Error uploading files", error: err.message });
      }

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

      try {
        // Find the business to update
        const business = await Business.findByPk(id);

        if (!business) {
          return res.status(404).json({ message: "Business not found" });
        }

        // Extract new file URLs (if any) from S3
        const updatedLogo = req.files.logo
          ? req.files.logo[0].location
          : business.logo;
        const updatedCacDoc = req.files.cacDoc
          ? req.files.cacDoc[0].location
          : business.cacDoc;

        // Ensure JSON fields are correctly parsed before storing/updating
        const socialArray = social ? JSON.parse(social) : business.social;
        const wifiArray = wifi ? JSON.parse(wifi) : business.wifi;
        const hoursArray = hours ? JSON.parse(hours) : business.hours;
        const amenitiesArray = amenities
          ? JSON.parse(amenities)
          : business.amenities;

        // Update business fields
        business.name = name || business.name;
        business.type = type || business.type;
        business.address = address || business.address;
        business.description = description || business.description;
        business.logo = updatedLogo || business.logo;
        business.amenities = amenitiesArray || business.amenities;
        business.cacDoc = updatedCacDoc || business.cacDoc;
        business.hours = hoursArray || business.hours;
        business.social = socialArray || business.social;
        business.wifi = wifiArray || business.wifi;

        await business.save();

        // Ensure the response data is formatted properly
        res.status(200).json({
          message: "Business updated successfully",
          data: {
            ...business.toJSON(),
            social:
              typeof business.social === "string"
                ? JSON.parse(business.social)
                : business.social,
            wifi:
              typeof business.wifi === "string"
                ? JSON.parse(business.wifi)
                : business.wifi,
            amenities:
              typeof business.amenities === "string"
                ? JSON.parse(business.amenities)
                : business.amenities,
            hours:
              typeof business.hours === "string"
                ? JSON.parse(business.hours)
                : business.hours,
          },
        });
      } catch (error) {
        console.error("Error updating business:", error);
        res.status(500).json({
          message: "Error updating business",
          error: error.message,
        });
      }
    });
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
      const user = await BusinessService.addWifiScanner(
        userId,
        businessId,
        location,
        wifiName
      );
      if (!user) return res.status(404).json({ message: "User not found" });
      return res
        .status(201)
        .json({ message: "Wifi Scanner added successfully", user });
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
};

module.exports = businessController;
