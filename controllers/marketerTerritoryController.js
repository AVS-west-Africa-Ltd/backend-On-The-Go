// controllers/marketerTerritoryController.js
const Marketer = require('../models/Marketer');
const MarketerTerritory = require('../models/MarketerTerritory');

const createMarketer = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const marketer = await Marketer.create({ name, email, phone });
    res.json({ message: 'Marketer created successfully', marketer });
  } catch (err) {
    console.error('Error creating marketer:', err.message);
    res.status(500).json({ message: 'Error creating marketer' });
  }
};

const createTerritory = async (req, res) => {
  try {
    const { latitude, longitude, radius, marketerId } = req.body;
    
    // Validate required fields
    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ 
        message: "Latitude, longitude and radius are required" 
      });
    }

    // Create the territory with optional marketerId
    const territory = await MarketerTerritory.create({
      latitude,
      longitude,
      radius,
      marketerId: marketerId || null,
      status: 'unassigned'
    });

    res.status(201).json({
      message: "Territory created successfully",
      territory
    });
  } catch (error) {
    console.error("Error creating territory:", error);
    res.status(500).json({
      message: "Error creating territory",
      error: error.message
    });
  }
};

const updateTerritoryStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [updated] = await MarketerTerritory.update(
      { status },
      { where: { id } }
    );
    if (updated) {
      res.json({ message: 'Territory status updated successfully' });
    } else {
      res.status(404).json({ message: 'Territory not found' });
    }
  } catch (err) {
    console.error('Error updating territory status:', err.message);
    res.status(500).json({ message: 'Error updating territory status' });
  }
};

const getMarketerTerritories = async (req, res) => {
  const { status } = req.query;

  try {
    const where = {};
    if (status) where.status = status;

    const territories = await MarketerTerritory.findAll({ where });
    
    // Manually include marketer data
    const territoriesWithMarketers = await Promise.all(
      territories.map(async territory => {
        const marketer = await territory.getMarketer();
        return {
          ...territory.toJSON(),
          marketer: marketer ? {
            id: marketer.id,
            name: marketer.name,
            email: marketer.email,
            phone: marketer.phone
          } : null
        };
      })
    );

    res.json({ territories: territoriesWithMarketers });
  } catch (err) {
    console.error('Error fetching territories:', err.message);
    res.status(500).json({ message: 'Error fetching territories' });
  }
};

const getMarketers = async (req, res) => {
  try {
    const marketers = await Marketer.findAll();
    
    // Manually include territories for each marketer
    const marketersWithTerritories = await Promise.all(
      marketers.map(async marketer => {
        const territories = await marketer.getTerritories();
        return {
          ...marketer.toJSON(),
          territories: territories.map(t => ({
            id: t.id,
            latitude: t.latitude,
            longitude: t.longitude,
            radius: t.radius,
            status: t.status
          }))
        };
      })
    );

    res.json({ marketers: marketersWithTerritories });
  } catch (err) {
    console.error('Error fetching marketers:', err.message);
    res.status(500).json({ message: 'Error fetching marketers' });
  }
};

module.exports = {
  createMarketer,
  createTerritory,
  updateTerritoryStatus,
  getMarketerTerritories,
  getMarketers
};