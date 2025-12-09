"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmenitiesService = void 0;
const models_1 = __importDefault(require("../models"));
const Amenity_1 = require("../models/Amenity");
const BranchAmenity_1 = require("../models/BranchAmenity");
const { sequelize } = models_1.default;
class AmenitiesService {
    static async getBranchAmenities(profileId, branchId) {
        try {
            const amenities = await BranchAmenity_1.BranchAmenity.findAll({
                where: {
                    branchId,
                    businessId: profileId,
                },
                include: [
                    {
                        model: Amenity_1.Amenity,
                        as: "amenity",
                        attributes: ["id", "name"],
                    }
                ]
            });
            return amenities;
        }
        catch (error) {
            console.error("Error when fetching branch amenities:--", error);
            throw new Error("Failed to fetch branch amenities");
        }
    }
    static async getAllAmenities() {
        try {
            const amenities = await Amenity_1.Amenity.findAll();
            return amenities;
        }
        catch (error) {
            console.error("Error when fetching global amenities--", error);
            throw new Error("Failed to fetch amenities");
        }
    }
    static async updateBranchAmenities(amenityIds, profileId, branchId) {
        try {
            await sequelize.transaction(async (t) => {
                // First, delete existing amenities for the branch
                await BranchAmenity_1.BranchAmenity.destroy({
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
                    status: "active",
                }));
                await BranchAmenity_1.BranchAmenity.bulkCreate(branchAmenities, { transaction: t });
            });
            return await BranchAmenity_1.BranchAmenity.findAll({
                where: {
                    branchId,
                    businessId: profileId,
                }
            });
        }
        catch (error) {
            console.error("Error when updating branch amenities:--", error);
            throw new Error("Failed to update branch amenities");
        }
    }
}
exports.AmenitiesService = AmenitiesService;
