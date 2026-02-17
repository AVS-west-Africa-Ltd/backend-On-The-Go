import { Request, Response } from "express";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { AmenitiesService } from "../services/amenity.service";

export const getAllAmenities = async (req: Request, res: Response) => {
    try {
        const amenities = await AmenitiesService.getAllAmenities();
        successHandler(res, "Amenities fetched successfully", 200, amenities);
    } catch (error: any) {
        errorHandler(res, "Failed to fetch amenities", 500, error);
    }
};

export const getBranchAmenities = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { branchId } = req.params;

        let branchIdd: number | undefined;
        if (branchId && !isNaN(Number(branchId))) {
            branchIdd = Number(branchId);
        } else {
            branchIdd = req.branch;
        }

        if (!branchIdd) {
            return errorHandler(res, "Branch ID is required", 400, null);
        }

        const amenities = await AmenitiesService.getBranchAmenities(profileId, branchIdd);
        successHandler(res, "Branch amenities fetched successfully", 200, amenities);
    } catch (error: any) {
        errorHandler(res, "Failed to fetch branch amenities", 500, error);
    }
};

export const addBranchAmenity = async (req: Request, res: Response) => {
    try {
        const { amenityId, branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user!;
        const effectiveBranchId = parseInt(branchId, 10) || req.branch!;

        if (!amenityId) {
            return errorHandler(res, "amenityId is required", 400, null);
        }

        const updatedAmenity = await AmenitiesService.addBranchAmenity(amenityId, profileId, effectiveBranchId, userId);
        successHandler(res, "Branch amenity added successfully", 200, updatedAmenity);
    } catch (error: any) {
        errorHandler(res, error.message || "Failed to add branch amenity", 500, error);
    }
}

export const removeBranchAmenity = async (req: Request, res: Response) => {
    try {
        const { amenityId, branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user!;
        const effectiveBranchId = parseInt(branchId, 10) || req.branch!;

        if (!amenityId) {
            return errorHandler(res, "amenityId is required", 400, null);
        }

        await AmenitiesService.removeBranchAmenity(amenityId, profileId, effectiveBranchId, userId);
        successHandler(res, "Branch amenity removed successfully", 200);
    } catch (error: any) {
        errorHandler(res, error.message || "Failed to remove branch amenity", 500, error);
    }
}