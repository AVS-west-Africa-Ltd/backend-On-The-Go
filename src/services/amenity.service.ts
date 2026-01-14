import db from "../models"
import { Amenity } from "../models/Amenity";
import { BranchAmenity } from "../models/BranchAmenity";
import { BranchService } from "./branches.service";

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

    static async addBranchAmenity(amenityId: string, profileId: number, branchId: number, userId: number): Promise<BranchAmenity> {
        try {
            // Check access
            const canAccess = await BranchService.checkAccess({ profileId, userId, branchId });
            if (!canAccess) {
                throw new Error("You don't have access to this branch");
            }

            const amenityExists = await BranchAmenity.findOne({
                where: {
                    branchId,
                    amenityId,
                }
            });

            if (amenityExists) {
                throw new Error("Amenity already exists for this branch");
            }

            const branchAmenity = await BranchAmenity.create({
                businessId: profileId,
                branchId,
                amenityId,
                status: "active",
            });

            return branchAmenity;
        } catch (error: any) {
            console.error("Error when adding branch amenity:--", error);
            throw new Error(error.message || "Failed to add branch amenity");
        }
    }

    static async removeBranchAmenity(branch_amenityId: string, profileId: number, branchId: number, userId: number): Promise<boolean> {
        try {
            // Check access
            const canAccess = await BranchService.checkAccess({ profileId, userId, branchId });
            if (!canAccess) {
                throw new Error("You don't have access to this branch");
            }

            const amenityExists = await BranchAmenity.findOne({
                where: {
                    branchId,
                    id: branch_amenityId
                }
            });
            console.log('amenityExists', amenityExists);

            if (!amenityExists) {
                throw new Error("Amenity not found");
            }
            const del = await BranchAmenity.destroy({
                where: {
                    branchId,
                    id: branch_amenityId
                }
            });
            console.log('deleted', del);

            return true;
        } catch (error: any) {
            console.error("Error when removing branch amenity:--", error);
            throw new Error(error.message || "Failed to remove branch amenity");
        }
    }
}