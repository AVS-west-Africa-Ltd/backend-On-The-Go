const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to create a location
router.post('/create', authMiddleware, locationController.createLocation);

// Route to get locations with a specified limit (default: 5)
// GET /locations?limit=1
router.get('/', authMiddleware, locationController.getLocationsByLimit); 

// Route to get a location by ID
router.get('/:id', authMiddleware, locationController.getLocationById);

// Route to get a specified number of locations (by limit)
// This is the route causing the error - let's remove it since getAllLocations already handles limits
router.get('/', authMiddleware, locationController.getAllLocations); 

// Route to update a location
router.put('/:id', authMiddleware, locationController.updateLocation);

// Route to delete a location
router.delete('/:id', authMiddleware, locationController.deleteLocation);

module.exports = router;