import db from "../models"
import { Amenity } from "../models/Amenity";
import { BranchAmenity } from "../models/BranchAmenity";

const { sequelize } = db

export class AmenitiesService {

    static async getBranchAmenities(profileId: number, branchId: number) {

        try {
            const amenities = await BranchAmenity.findAll({
                where: {
                    branchId,
                    // businessId: profileId,
                },
                attributes: { exclude: ["businessId", "branchId", "amenityId"] },
                include: [
                    {
                        model: Amenity,
                        as: "amenity",
                        attributes: ["id", "name"],
                    }
                ]
            });

            return amenities;
        } catch (error) {
            console.error("Error when fetching branch amenities:--", error);

            throw new Error("Failed to fetch branch amenities");
        }
    }

    static async getAllAmenities() {
        try {
            const amenities = await Amenity.findAll();

            return amenities;
        } catch (error) {
            console.error("Error when fetching global amenities--", error);

            throw new Error("Failed to fetch amenities");
        }
    }

    static async addBranchAmenities(amenityIds: string[], profileId: number, branchId: number): Promise<BranchAmenity[]> {
        try {
            await sequelize.transaction(async (t) => {
                // Fetch existing amenities to avoid duplicates if necessary, 
                // but since we have a unique index, we can also use ignoreDuplicates
                const branchAmenities = amenityIds.map((amenityId) => ({
                    businessId: profileId,
                    branchId,
                    amenityId,
                    status: "active" as const,
                }));

                await BranchAmenity.bulkCreate(branchAmenities, {
                    transaction: t,
                    ignoreDuplicates: true
                });
            });
            return await BranchAmenity.findAll({
                where: {
                    branchId,
                    businessId: profileId,
                }
            });
        } catch (error) {
            console.error("Error when adding branch amenities:--", error);
            throw new Error("Failed to add branch amenities");
        }
    }

    static async removeBranchAmenities(amenityIds: string[], profileId: number, branchId: number): Promise<void> {
        try {
            await BranchAmenity.destroy({
                where: {
                    branchId,
                    businessId: profileId,
                    amenityId: amenityIds
                }
            });
        } catch (error) {
            console.error("Error when removing branch amenities:--", error);
            throw new Error("Failed to remove branch amenities");
        }
    }
}