const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Business = require("../models/Business");
const { BusinessPosts } = require("../models/index");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");

// Multer storage and configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = Date.now() + "-" + file.originalname;
//     cb(null, uniqueName);
//   },
// });
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "business_posts", // Cloudinary folder where files will be stored
    allowed_formats: ["jpg", "jpeg", "pdf", "png", "gif"], // Allowed file types
    public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Generate unique file names
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

      if (!req.files || (!req.files["logo"] && !req.files["cacDoc"])) {
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
          const socialArray = social ? JSON.parse(social) : [];

          const business = await Business.create({
            userId,
            name,
            type,
            address,
            description,
            amenities,
            hours,
            social: socialArray,
            wifi,
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
      } else {
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
          // Extract file paths from Multer
          const logo = req.files.logo
            ? `${req.protocol}://${req.get("host")}/uploads/${
                req.files.logo[0].filename
              }`
            : null;
          const cacDoc = req.files.cacDoc
            ? `${req.protocol}://${req.get("host")}/uploads/${
                req.files.cacDoc[0].filename
              }`
            : null;

          const socialArray = social ? JSON.parse(social) : [];

          const business = await Business.create({
            userId,
            name,
            type,
            address,
            description,
            logo,
            amenities,
            cacDoc,
            hours,
            social: socialArray,
            wifi,
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

  // Get a user business

  getUserBusinesses: async (req, res) => {
    try {
      const { userId } = req.params;
      const business = await Business.findOne({
        where: { userId: userId },
        // include: [
        //   {
        //     model: Business,
        //     as: "businesses", // Match the alias used in the association
        //   },
        // ],
      });

      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }

      return res.status(200).json(business);
    } catch (error) {
      console.error("Error fetching user's businesses:", error);
      throw error;
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

      const { id } = req.params;
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
          ? `${req.protocol}://${req.get("host")}/uploads/${
              req.files.logo[0].filename
            }`
          : business.logo; // Keep existing logo if not updated
        const updatedCacDoc = req.files.cacDoc
          ? `${req.protocol}://${req.get("host")}/uploads/${
              req.files.cacDoc[0].filename
            }`
          : business.cacDoc;

        const socialArray = social ? JSON.parse(social) : business.social;

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
};

module.exports = businessController;
