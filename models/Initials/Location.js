const pool = require("../config/db");

const Location = {
  // Create a new location
  createLocation: async (
    uploadedBy,
    name,
    area,
    city,
    logoUrl,
    averageRating
  ) => {
    const [result] = await pool.query(
      "INSERT INTO locations (uploaded_by, name, area, city, logo_url, average_rating) VALUES (?, ?, ?, ?, ?, ?)",
      [uploadedBy, name, area, city, logoUrl, averageRating]
    );
    return result.insertId;
  },

  // Get all locations, with an optional limit
  getAllLocations: async () => {
    const [locations] = await pool.query(
      "SELECT * FROM locations ORDER BY created_at DESC"
    );
    return locations;
  }
,  

  // Get a location by ID
  getLocationById: async (locationId) => {
    const [location] = await pool.query(
      "SELECT * FROM locations WHERE id = ?",
      [locationId]
    );
    return location[0] || null;
  },

  // Get a specified number of locations
  getLocationsByLimit: async (limit = 5) => {
    const [locations] = await pool.query(
      "SELECT * FROM locations ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    return locations;
  },

  // Update location details
  updateLocation: async (locationId, updates) => {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach((key) => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    values.push(locationId);

    const query = `UPDATE locations SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // Delete a location
  deleteLocation: async (locationId) => {
    // Delete related data first (photos, amenities, reviews)
    await pool.query("DELETE FROM location_photos WHERE location_id = ?", [
      locationId,
    ]);
    await pool.query("DELETE FROM location_amenities WHERE location_id = ?", [
      locationId,
    ]);
    await pool.query("DELETE FROM reviews WHERE location_id = ?", [locationId]);

    const [result] = await pool.query("DELETE FROM locations WHERE id = ?", [
      locationId,
    ]);
    return result.affectedRows > 0;
  },

  // Get location photos by location ID
  getLocationPhotos: async (locationId) => {
    const [photos] = await pool.query(
      "SELECT * FROM location_photos WHERE location_id = ?",
      [locationId]
    );
    return photos;
  },

  // Add location photos
  addLocationPhotos: async (locationId, photos, uploadedBy) => {
    const queries = photos.map((photo) => {
      return pool.query(
        "INSERT INTO location_photos (location_id, photo_url, uploaded_by) VALUES (?, ?, ?)",
        [locationId, photo.photoUrl, uploadedBy]
      );
    });
    await Promise.all(queries);
  },

  // Update location photos
  updateLocationPhotos: async (locationId, photos) => {
    // Delete existing photos before adding new ones
    await pool.query("DELETE FROM location_photos WHERE location_id = ?", [
      locationId,
    ]);

    // Add new photos
    const queries = photos.map((photo) => {
      return pool.query(
        "INSERT INTO location_photos (location_id, photo_url) VALUES (?, ?)",
        [locationId, photo.photoUrl]
      );
    });
    await Promise.all(queries);
  },

  // Get location amenities by location ID
  getLocationAmenities: async (locationId) => {
    const [amenities] = await pool.query(
      "SELECT a.name, la.status FROM location_amenities la JOIN amenities a ON la.amenity_id = a.id WHERE la.location_id = ?",
      [locationId]
    );
    return amenities;
  },

  addLocationReviews: async (locationId, reviews) => {
    const queries = [];

    for (const review of reviews) {
      // First verify the user exists
      const [userExists] = await pool.query(
        "SELECT id FROM users WHERE id = ?",
        [review.userId]
      );

      if (userExists.length > 0) {
        queries.push(
          pool.query(
            "INSERT INTO reviews (location_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
            [locationId, review.userId, review.rating, review.comment]
          )
        );
      } else {
        console.warn(
          `Skipping review for non-existent user ID: ${review.userId}`
        );
      }
    }

    if (queries.length > 0) {
      await Promise.all(queries);
    }
  },
  // In Location.js, add or update this function
  addLocationAmenities: async (locationId, amenities) => {
    const queries = [];

    for (let amenity of amenities) {
      // Validate that the amenity_id exists first
      const [amenityExists] = await pool.query(
        "SELECT id FROM amenities WHERE id = ?",
        [amenity.amenityId]
      );

      if (amenityExists.length > 0) {
        queries.push(
          pool.query(
            "INSERT INTO location_amenities (location_id, amenity_id, status) VALUES (?, ?, ?)",
            [locationId, amenity.amenityId, amenity.status]
          )
        );
      } else {
        console.warn(`Skipping non-existent amenity ID: ${amenity.amenityId}`);
      }
    }

    if (queries.length > 0) {
      await Promise.all(queries);
    }
  },
  // Update location amenities
  updateLocationAmenities: async (locationId, amenities) => {
    // Delete existing amenities before adding new ones
    await pool.query("DELETE FROM location_amenities WHERE location_id = ?", [
      locationId,
    ]);

    // Add new amenities
    const queries = amenities.map((amenity) => {
      return pool.query(
        "INSERT INTO location_amenities (location_id, amenity_id, status) VALUES (?, ?, ?)",
        [locationId, amenity.amenityId, amenity.status]
      );
    });
    await Promise.all(queries);
  },

  // Get reviews for a location
  getLocationReviews: async (locationId) => {
    const [reviews] = await pool.query(
      "SELECT r.rating, r.comment, r.status, r.created_at, u.username FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.location_id = ?",
      [locationId]
    );
    return reviews;
  },

  // Add reviews for a location
  addLocationReviews: async (locationId, reviews) => {
    const queries = reviews.map((review) => {
      return pool.query(
        "INSERT INTO reviews (location_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
        [locationId, review.userId, review.rating, review.comment]
      );
    });
    await Promise.all(queries);
  },

  // Update reviews for a location
  updateLocationReviews: async (locationId, reviews) => {
    // Delete existing reviews before adding new ones
    await pool.query("DELETE FROM reviews WHERE location_id = ?", [locationId]);

    // Add new reviews
    const queries = reviews.map((review) => {
      return pool.query(
        "INSERT INTO reviews (location_id, user_id, rating, comment) VALUES (?, ?, ?, ?)",
        [locationId, review.userId, review.rating, review.comment]
      );
    });
    await Promise.all(queries);
  },
};

module.exports = Location;
