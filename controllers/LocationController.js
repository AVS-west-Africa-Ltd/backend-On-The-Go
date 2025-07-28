// controllers/LocationController.js
const LocationService = require("../services/LocationService");
const { Location, Business } = require("../models");
const upload = require("../utils/multerSetup");
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

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
  },

  getAllLocationBusiness:  async (req, res) => {
    const { offset, search } = req.query;
    const offsetParsed = Number(offset);
    try {
      const locations = await Location.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { vicinity: { [Op.like]: `%${search}%` } },
            { types: { [Op.like]: `%${search}%` } }
          ]
        },
        limit: 50,
        offset: offsetParsed
      });

      const businesses = await Business.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { address: { [Op.like]: `%${search}%` } },
            { type: { [Op.like]: `%${search}%` } },
          ],
        },
        limit: 50,
        offset: offsetParsed,
      });

      res.status(200).json({ locations, businesses, message: " Location & Business info fetch " });

    } catch (error) {
      console.error( "Error fetching locations & businesses:", error );
      res.status(500).json({ message: "Error fetching locations" });
    }

    

  }
};