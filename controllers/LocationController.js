// controllers/LocationController.js
const LocationService = require("../services/LocationService");
const upload = require("../utils/multerSetup");
const path = require('path');
const fs = require('fs');

module.exports = {
  uploadLocations: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      const filePath = path.join(__dirname, '../uploads', req.file.filename);
      const locations = await LocationService.uploadLocationsFromCSV(filePath);
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      res.status(201).json({
        message: "Locations uploaded successfully",
        count: locations.length,
        data: locations
      });
    } catch (error) {
      console.error("Error uploading locations:", error);
      res.status(500).json({
        message: "Error uploading locations",
        error: error.message
      });
    }
  },

  getAllLocations: async (req, res) => {
    try {
      const locations = await LocationService.getAllLocations();
      res.status(200).json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({
        message: "Error fetching locations",
        error: error.message
      });
    }
  }
};