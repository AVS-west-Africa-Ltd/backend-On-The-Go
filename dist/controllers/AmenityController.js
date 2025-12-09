"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBranchAmenities = exports.getBranchAmenities = exports.getAllAmenities = void 0;
const responseHandlers_1 = require("../handlers/responseHandlers");
const amenity_service_1 = require("../services/amenity.service");
const getAllAmenities = async (req, res) => {
    try {
        const amenities = await amenity_service_1.AmenitiesService.getAllAmenities();
        (0, responseHandlers_1.successHandler)(res, "Amenities fetched successfully", 200, amenities);
    }
    catch (error) {
        (0, responseHandlers_1.errorHandler)(res, "Failed to fetch amenities", 500);
    }
};
exports.getAllAmenities = getAllAmenities;
const getBranchAmenities = async (req, res) => {
    try {
        const profileId = req.profile.id;
        const branchId = req.branch;
        const amenities = await amenity_service_1.AmenitiesService.getBranchAmenities(profileId, branchId);
        (0, responseHandlers_1.successHandler)(res, "Branch amenities fetched successfully", 200, amenities);
    }
    catch (error) {
        (0, responseHandlers_1.errorHandler)(res, "Failed to fetch branch amenities", 500);
    }
};
exports.getBranchAmenities = getBranchAmenities;
const updateBranchAmenities = async (req, res) => {
    try {
        const profileId = req.profile.id;
        const branchId = req.branch;
        const { amenityIds } = req.body;
        if (!Array.isArray(amenityIds) || amenityIds.length === 0) {
            return (0, responseHandlers_1.errorHandler)(res, "amenityIds must be a non-empty array", 400);
        }
        const updatedAmenities = await amenity_service_1.AmenitiesService.updateBranchAmenities(amenityIds, profileId, branchId);
        (0, responseHandlers_1.successHandler)(res, "Branch amenities updated successfully", 200, updatedAmenities);
    }
    catch (error) {
        (0, responseHandlers_1.errorHandler)(res, "Failed to update branch amenities", 500);
    }
};
exports.updateBranchAmenities = updateBranchAmenities;
