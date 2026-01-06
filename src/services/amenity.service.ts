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

    static async updateBranchAmenities(amenityIds: string[], profileId: number, branchId: number): Promise<BranchAmenity[]> {
        try {
            await sequelize.transaction(async (t) => {
                // First, delete existing amenities for the branch
                await BranchAmenity.destroy({
                    where: {
                        branchId,
                        businessId: profileId,
                    },
                    transaction: t,
                });

                // Then, add the new amenities
                const branchAmenities = amenityIds.map((amenityId) => ({
                    businessId: profileId,
                    branchId,
                    amenityId,
                    status: "active" as const,
                }));

                await BranchAmenity.bulkCreate(branchAmenities, { transaction: t });
            });
            return await BranchAmenity.findAll({
                where: {
                    branchId,
                    businessId: profileId,
                }
            });
        } catch (error) {
            console.error("Error when updating branch amenities:--", error);

            throw new Error("Failed to update branch amenities");
        }
    }
}