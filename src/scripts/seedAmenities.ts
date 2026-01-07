import db from '../models/';
import { AmenityCategory } from '../models/types/amenity.types';

export const seedAmenities = async () => {
  try {
    const definedAmenities = Object.values(AmenityCategory);

    // Fetch existing amenities from DB
    const existingAmenities = await db.Amenity.findAll({
      attributes: ['name']
    });

    const existingNames = new Set(existingAmenities.map((a: any) => a.name));

    // Filter for amenities that are in the constant but NOT in the DB
    const newAmenities = definedAmenities.filter(name => !existingNames.has(name)).map(name => ({
      name,
      meta: {}
    }));

    if (newAmenities.length > 0) {
      await db.Amenity.bulkCreate(newAmenities);
      console.log(`Seeded ${newAmenities.length} new amenities: ${newAmenities.map(a => a.name).join(', ')}`);
    }
    // else {
    //   console.log("All amenities already exist. Skipping seed.");
    // }
  } catch (err) {
    console.error("Error seeding amenities:", err);
  }
};

// Only run immediately if this script is executed directly (not imported)
if (require.main === module) {
  seedAmenities();
}

