const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Business = require("../models/Business");
const { BusinessPosts } = require("../models/index");

// Multer storage and configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/"); // Upload directory
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// File filter for images and PDFs
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF documents are allowed!"), false);
  }
};

// Multer middleware
const upload = multer({ storage, fileFilter });

const businessController = {
  // Create a new Business
  createBusiness: async (req, res) => {
    // Set up Multer to handle fields dynamically
    const uploadHandler = upload.fields([
      { name: "logo", maxCount: 1 }, // Single logo image
      { name: "cacDoc", maxCount: 1 }, // Single CAC document
    ]);

    // Handle the file upload
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
        openingTime,
        closingTime,
        social,
        wifiName,
        wifiPassword,
      } = req.body;

      try {
        // Extract file paths from Multer
        const logo = req.files.logo
          ? `${req.protocol}://${req.get("host")}/images/${
              req.files.logo[0].filename
            }`
          : null;
        const cacDoc = req.files.cacDoc
          ? `${req.protocol}://${req.get("host")}/images/${
              req.files.cacDoc[0].filename
            }`
          : null;

        // console.log(req.files.logo[0].path);
        // console.log(
        //   `${req.protocol}://${req.get("host")}/images/${
        //     req.files.logo[0].filename
        //   }`
        // );
        //

        // Parse social array if it's a JSON string
        const socialArray = social ? JSON.parse(social) : [];

        // Create a new business
        const newBusiness = await Business.create({
          userId,
          name,
          type,
          address,
          description,
          logo,
          amenities,
          cacDoc,
          openingTime,
          closingTime,
          social: socialArray,
          wifiName,
          wifiPassword,
        });

        res.status(201).json({
          message: "Business created successfully",
          data: newBusiness,
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
      const businesses = await Business.findAll();
      return res.status(200).json({
        message: "Businesses retrieved successfully",
        data: businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get a single Business by ID
  getBusinessById: async (req, res) => {
    try {
      const { id } = req.params;
      const business = await Business.findByPk(id);
      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }
      return res.status(200).json({
        message: "Business retrieved successfully",
        data: business,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve business",
        error: error.message,
      });
    }
  },

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

      const { id } = req.params; // Extract the business ID from route params
      const {
        name,
        type,
        address,
        description,
        amenities,
        openingTime,
        closingTime,
        social,
        wifiName,
        wifiPassword,
      } = req.body;

      try {
        // Find the business to update
        const business = await Business.findByPk(id);

        if (!business) {
          return res.status(404).json({ message: "Business not found" });
        }

        // Extract new file paths (if any) and save relative paths
        const updatedLogo = req.files.logo
          ? `${req.protocol}://${req.get("host")}/images/${
              req.files.logo[0].filename
            }`
          : business.logo; // Keep existing logo if not updated
        const updatedCacDoc = req.files.cacDoc
          ? `${req.protocol}://${req.get("host")}/images/${
              req.files.cacDoc[0].filename
            }`
          : business.cacDoc; // Keep existing document if not updated

        // `${req.protocol}://${req.get("host")}/images/${file.filename}`;

        // Parse social array if it's a JSON string
        const socialArray = social ? JSON.parse(social) : business.social;

        // Update business details
        business.name = name || business.name;
        business.type = type || business.type;
        business.address = address || business.address;
        business.description = description || business.description;
        business.logo = updatedLogo;
        business.amenities = amenities || business.amenities;
        business.cacDoc = updatedCacDoc;
        business.openingTime = openingTime || business.openingTime;
        business.closingTime = closingTime || business.closingTime;
        business.social = socialArray;
        business.wifiName = wifiName || business.wifiName;
        business.wifiPassword = wifiPassword || business.wifiPassword;

        // Save the updated business
        await business.save();

        res.status(200).json({
          message: "Business updated successfully",
          data: business,
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

  // Delete a Business

  deleteBusiness: async (req, res) => {
    try {
      const { id } = req.params;
      const business = await Business.findByPk(id);

      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }

      await business.destroy();
      return res.status(200).json({
        message: "Business deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to delete business",
        error: error.message,
      });
    }
  },

  getBusinessPosts: async (req, res) => {
    const { businessId } = req.params;

    try {
      // Query the Business table with its related posts
      const business = await Business.findByPk(businessId, {
        attributes: ["id", "name", "type", "logo"], // Fields to include from Business
        include: {
          model: BusinessPosts,
          as: "BusinessPosts", // Ensure the alias matches the association
          attributes: ["id", "media", "postText", "createdAt"], // Fields to include from BusinessPosts
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
};

module.exports = businessController;
