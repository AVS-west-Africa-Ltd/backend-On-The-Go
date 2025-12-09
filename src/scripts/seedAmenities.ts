import db from '../models/';
import { AmenityCategory } from '../models/types/amenity.types';

const seedAmenities = async () => {
  try {
    const amenities = Object.values(AmenityCategory).map((name) => ({
      name,
      meta: {},
    }));

    await db.Amenity.bulkCreate(amenities, {
      updateOnDuplicate: ["name", "meta"],
    });

    console.log("Amenities seeded or updated!");
  } catch (err) {
    console.error("Error seeding amenities:", err);
  }
};

seedAmenities();
