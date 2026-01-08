import { Request, Response } from "express";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { AmenitiesService } from "../services/amenity.service";

export const getAllAmenities = async (req: Request, res: Response) => {
    try {
        const amenities = await AmenitiesService.getAllAmenities();
        successHandler(res, "Amenities fetched successfully", 200, amenities);
    } catch (error) {
        errorHandler(res, "Failed to fetch amenities", 500);
    }
};

export const getBranchAmenities = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { branchId } = req.params;
        // const branchId = req.branch!;

        const amenities = await AmenitiesService.getBranchAmenities(profileId, Number(branchId));
        successHandler(res, "Branch amenities fetched successfully", 200, amenities);
    } catch (error) {
        errorHandler(res, "Failed to fetch branch amenities", 500);
    }
};

export const addBranchAmenities = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const branchId = req.branch!;
        const { amenityIds }: { amenityIds: string[] } = req.body;

        if (!Array.isArray(amenityIds) || amenityIds.length === 0) {
            return errorHandler(res, "amenityIds must be a non-empty array", 400);
        }

        const updatedAmenities = await AmenitiesService.addBranchAmenities(amenityIds, profileId, branchId);
        successHandler(res, "Branch amenities added successfully", 200, updatedAmenities);
    } catch (error) {
        errorHandler(res, "Failed to add branch amenities", 500);
    }
}

export const removeBranchAmenities = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const branchId = req.branch!;
        const { amenityIds }: { amenityIds: string[] } = req.body;

        if (!Array.isArray(amenityIds) || amenityIds.length === 0) {
            return errorHandler(res, "amenityIds must be a non-empty array", 400);
        }

        await AmenitiesService.removeBranchAmenities(amenityIds, profileId, branchId);
        successHandler(res, "Branch amenities removed successfully", 200);
    } catch (error) {
        errorHandler(res, "Failed to remove branch amenities", 500);
    }
}