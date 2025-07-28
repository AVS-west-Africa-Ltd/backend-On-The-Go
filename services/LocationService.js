// services/LocationService.js
const { Location } = require("../models");
const csv = require('csv-parser');
const fs = require('fs');

module.exports = {
  uploadLocationsFromCSV: async (filePath) => {
    const results = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          try {
            const locations = await Promise.all(
              results.map(async (row) => {
                return Location.create({
                  name: row.Name,
                  lat: parseFloat(row.Lat),
                  lon: parseFloat(row.Lon),
                  icon: row['Icon/Logo'],
                  types: row.Types,
                  vicinity: row.Vicinity
                });
              })
            );
            resolve(locations);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  },

  getAllLocations: async () => {
    return await Location.findAll({ limit: 100 });
  }
};