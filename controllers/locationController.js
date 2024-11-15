const Location = require("../models/Location");

const locationController = {
  // Create a location with amenities, photos, and reviews
  createLocation: async (req, res) => {
    const {
      name,
      area,
      city,
      logoUrl,
      averageRating,
      amenities,
      photos,
      reviews,
    } = req.body;
    const uploadedBy = req.userId; // This comes from auth middleware

    try {
      // Input validation
      if (!name || !area || !city) {
        return res
          .status(400)
          .json({ message: "Name, area, and city are required fields" });
      }

      // Create the location first
      const locationId = await Location.createLocation(
        uploadedBy,
        name,
        area,
        city,
        logoUrl || null,
        averageRating || 0
      );

      // Process amenities if provided
      if (amenities && Array.isArray(amenities) && amenities.length > 0) {
        // Validate amenities structure
        const validAmenities = amenities.every((a) => a.amenityId && a.status);
        if (!validAmenities) {
          throw new Error(
            "Invalid amenities structure. Each amenity must have amenityId and status"
          );
        }
        await Location.addLocationAmenities(locationId, amenities);
      }

      // Process photos if provided
      if (photos && Array.isArray(photos) && photos.length > 0) {
        // Validate photos structure
        const validPhotos = photos.every((p) => p.photoUrl);
        if (!validPhotos) {
          throw new Error(
            "Invalid photos structure. Each photo must have a photoUrl"
          );
        }
        await Location.addLocationPhotos(locationId, photos, uploadedBy);
      }

      // Process reviews if provided
      if (reviews && Array.isArray(reviews) && reviews.length > 0) {
        // Validate reviews structure
        const validReviews = reviews.every(
          (r) => r.userId && r.rating && r.comment
        );
        if (!validReviews) {
          throw new Error(
            "Invalid reviews structure. Each review must have userId, rating, and comment"
          );
        }
        await Location.addLocationReviews(locationId, reviews);
      }

      // Fetch the complete location data to return
      const createdLocation = await Location.getLocationById(locationId);
      createdLocation.amenities = await Location.getLocationAmenities(
        locationId
      );
      createdLocation.photos = await Location.getLocationPhotos(locationId);
      createdLocation.reviews = await Location.getLocationReviews(locationId);

      res.status(201).json({
        message: "Location created successfully",
        location: createdLocation,
      });
    } catch (error) {
      console.error("Error in createLocation:", error);
      if (error.message.includes("Invalid")) {
        return res.status(400).json({ message: error.message });
      }
      res
        .status(500)
        .json({ message: "Error creating location", error: error.message });
    }
  },
  // Get all locations with photos, amenities, and reviews
  getAllLocations: async (req, res) => {
    try {
      const locations = await Location.getAllLocations(); // Fetch all locations without a limit
      // Fetch related data for each location (amenities, photos, reviews)
      for (let location of locations) {
        location.amenities = await Location.getLocationAmenities(location.id);
        location.photos = await Location.getLocationPhotos(location.id);
        location.reviews = await Location.getLocationReviews(location.id);
      }
      res.status(200).json(locations);
    } catch (error) {
      console.error("Error in getAllLocations:", error);
      res
        .status(500)
        .json({ message: "Error fetching locations", error: error.message });
    }
  },
  // Get a specific location by ID with amenities, photos, and reviews
  getLocationById: async (req, res) => {
    const locationId = req.params.id;

    try {
      const location = await Location.getLocationById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Fetch related data
      location.amenities = await Location.getLocationAmenities(locationId);
      location.photos = await Location.getLocationPhotos(locationId);
      location.reviews = await Location.getLocationReviews(locationId);

      res.status(200).json(location);
    } catch (error) {
      console.error("Error in getLocationById:", error);
      res
        .status(500)
        .json({ message: "Error fetching location", error: error.message });
    }
  },

  getLocationsByLimit: async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    try {
      const locations = await Location.getLocationsByLimit(limit);
      for (let location of locations) {
        location.amenities = await Location.getLocationAmenities(location.id);
        location.photos = await Location.getLocationPhotos(location.id);
        location.reviews = await Location.getLocationReviews(location.id);
      }
      res.status(200).json(locations);
    } catch (error) {
      console.error("Error in getLocationsByLimit:", error);
      res
        .status(500)
        .json({ message: "Error fetching locations", error: error.message });
    }
  },

  // Update location details, including amenities, photos, and reviews
  updateLocation: async (req, res) => {
    const locationId = req.params.id;
    const {
      name,
      area,
      city,
      logoUrl,
      averageRating,
      amenities,
      photos,
      reviews,
    } = req.body;
    const uploadedBy = req.userId;

    try {
      // Check if location exists
      const existingLocation = await Location.getLocationById(locationId);
      if (!existingLocation) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Update base location details
      const updates = {};
      if (name) updates.name = name;
      if (area) updates.area = area;
      if (city) updates.city = city;
      if (logoUrl) updates.logo_url = logoUrl;
      if (averageRating) updates.average_rating = averageRating;

      await Location.updateLocation(locationId, updates);

      // Update amenities if provided
      if (amenities && Array.isArray(amenities) && amenities.length > 0) {
        await Location.updateLocationAmenities(locationId, amenities);
      }

      // Update photos if provided
      if (photos && Array.isArray(photos) && photos.length > 0) {
        await Location.updateLocationPhotos(locationId, photos);
      }

      // Update reviews if provided
      if (reviews && Array.isArray(reviews) && reviews.length > 0) {
        await Location.updateLocationReviews(locationId, reviews);
      }

      // Fetch updated location data
      const updatedLocation = await Location.getLocationById(locationId);
      updatedLocation.amenities = await Location.getLocationAmenities(
        locationId
      );
      updatedLocation.photos = await Location.getLocationPhotos(locationId);
      updatedLocation.reviews = await Location.getLocationReviews(locationId);

      res.status(200).json({
        message: "Location updated successfully",
        location: updatedLocation,
      });
    } catch (error) {
      console.error("Error in updateLocation:", error);
      res
        .status(500)
        .json({ message: "Error updating location", error: error.message });
    }
  },

  // Delete location by ID, including its amenities, photos, and reviews
  deleteLocation: async (req, res) => {
    const locationId = req.params.id;

    try {
      // Check if location exists
      const location = await Location.getLocationById(locationId);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      // Delete location and all related data
      await Location.deleteLocation(locationId);

      res.status(200).json({
        message: "Location and all associated data deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteLocation:", error);
      res
        .status(500)
        .json({ message: "Error deleting location", error: error.message });
    }
  },
};

module.exports = locationController;
