import { Request, Response } from "express";
import { BranchService } from "../services/branches.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { createBranchSchema } from "../validators/branch.validator";

export const create = async (req: Request, res: Response) => {
        try {
            
        const value = req.body;

        const input = value;
        const profileId = req.profile!.id;
        const userId = req.user;

        const branchData = await BranchService.createBranch(input, {
            profileId,
            userId
        });

        return successHandler(res, "Branch created successfully", 201, branchData);


    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to create branch", 500, error);
    }
}

export const getBranches = async (req: Request, res: Response) => {
    try {
        const { cursor, limit = "10", search = "" } = req.query;
        const profileId = req.profile!.id;
        const userId = req.user;

        const { branches, total, nextCursor } = await BranchService.getBranches(
            {
                cursor: cursor as string,
                limit: parseInt(limit as string, 10),
                search: search as string
            },
            {
                profileId,
                userId
            }
        );

    return successHandler(res, "Branches fetched successfully", 200, {
      branches,
      total,
      nextCursor,
      limit: parseInt(limit as string, 10)
    });
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to fetch branches", 500, error);
    }
}

export const getBranch = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user;

        if (!branchId) {
            return errorHandler(res, "branchId is required", 400);
        }

        const branch = await BranchService.getBranchById(parseInt(branchId, 10), profileId, userId);

        if (!branch) {
            return errorHandler(res, "Branch not found", 404);
        }

        return successHandler(res, "Branch fetched successfully", 200, branch);
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to fetch branch", 500, error);
    }
}


export const deleteBranch = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const profileId = req.profile!.id;

    if (!branchId) {
      return errorHandler(res, "branchId is required", 400);
    }

    const deleted = await BranchService.deleteBranch(
      parseInt(branchId, 10),
      profileId
    );

    if (!deleted) {
      return errorHandler(res, "Branch could not be deleted", 404);
    }

    return successHandler(res, "Branch deleted successfully", 200);
  } catch (error: any) {
    console.error("Failed to delete branch:", error);
    return errorHandler(res, error.message || "Something went wrong while deleting the branch", 500, error);
  }
};

export const updateBranchStatus = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;

        if (!branchId) {
            return errorHandler(res, "branchId is required", 400);
        }

        const updated = await BranchService.updateBranchStatus(parseInt(branchId, 10), req.profile!.id);

        if (!updated) {
            return errorHandler(res, "Branch status could not be updated", 404);
        }

        return successHandler(res, "Branch status updated successfully", 200);
    } catch (error: any) {
        console.error("Failed to update branch status:", error);
        return errorHandler(res, error.message || "Something went wrong while updating the branch status", 500, error);
    }
}
