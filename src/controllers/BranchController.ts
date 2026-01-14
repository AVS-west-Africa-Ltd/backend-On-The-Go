import { Request, Response } from "express";
import { BranchService } from "../services/branches.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export const create = async (req: Request, res: Response) => {
    try {

        const value = req.body;

        const input = value;
        const profileId = req.admin?.profileId!;
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
        const profileId = req.admin?.profileId!;
        const userId = req.user;
        console.log(profileId, userId);


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
        const userId = req.user;

        if (!branchId) {
            return errorHandler(res, "branchId is required", 400);
        }

        const deleted = await BranchService.deleteBranch(
            parseInt(branchId, 10),
            profileId,
            userId
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
        const profileId = req.profile!.id;
        const userId = req.user;

        if (!branchId) {
            return errorHandler(res, "branchId is required", 400);
        }

        const updated = await BranchService.updateBranchStatus(
            parseInt(branchId, 10),
            profileId,
            userId
        );

        if (!updated) {
            return errorHandler(res, "Branch not found", 404);
        }

        return successHandler(res, "Branch status updated successfully", 200);
    } catch (error: any) {
        console.error("Failed to update branch status:", error);
        return errorHandler(
            res,
            error.message ||
            "Something went wrong while updating the branch status",
            error.statusCode || 500,
            error
        );
    }
}

export const inviteStaff = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user;
        const { firstName, lastName, email, role } = req.body;

        if (!branchId) return errorHandler(res, "branchId is required", 400);

        const result = await BranchService.inviteStaff(
            parseInt(branchId, 10),
            { firstName, lastName, email, role },
            { profileId, userId }
        );

        return successHandler(res, "Invitation sent successfully", 200, result);
    } catch (error: any) {
        console.error("Failed to invite staff:", error);
        return errorHandler(res, error.message || "Failed to invite staff", error.statusCode || 500, error);
    }
}

export const getBranchOrders = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user;
        const result = await BranchService.getBranchOrders(parseInt(branchId, 10), profileId, userId, req.query as any);
        return successHandler(res, "Branch orders fetched successfully", 200, result || {});
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch orders", error.statusCode || 500, error);
    }
}

export const getBranchStaff = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user;
        const result = await BranchService.getBranchStaff(parseInt(branchId, 10), profileId, userId, req.query as any);
        return successHandler(res, "Branch staff fetched successfully", 200, result || {});
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch staff", error.statusCode || 500, error);
    }
}

export const getBranchWifi = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile!.id;
        const userId = req.user;
        const result = await BranchService.getBranchWifi(parseInt(branchId, 10), profileId, userId);
        return successHandler(res, "Branch wifi infrastructure fetched successfully", 200, result || {});
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch wifi info", error.statusCode || 500, error);
    }
}

// export const getBranchProducts = async (req: Request, res: Response) => {
//     try {
//         const { branchId } = req.params;
//         const profileId = req.profile!.id;
//         const userId = req.user;
//         const result = await BranchService.getBranchProducts(parseInt(branchId, 10), profileId, userId, req.query as any);
//         return successHandler(res, "Branch products fetched successfully", 200, result || {});
//     } catch (error: any) {
//         return errorHandler(res, error.message || "Failed to fetch products", error.statusCode || 500, error);
//     }
// }

export const getBranchLogs = async (req: Request, res: Response) => {
    try {
        const { branchId, cursor, limit, search } = req.query as any;
        const profileId = req.profile!.id;
        const userId = req.user;
        const loggedInUserBranchId = req.branch!;
        let branchIdd: number | undefined;

        if (branchId && !isNaN(Number(branchId))) {
            branchIdd = Number(branchId);
        } else {
            branchIdd = loggedInUserBranchId;
        }

        if (!branchIdd) {
            return errorHandler(res, "Invalid branch ID", 400);
        }

        const result = await BranchService.getBranchLogs(branchIdd, profileId, userId, { cursor, limit, search });
        return successHandler(res, "Branch activity logs fetched successfully", 200, result || {});
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch logs", error.statusCode || 500, error);
    }
}

export const getBranchMedia = async (req: Request, res: Response) => {
    try {
        const { branchId, cursor, limit, mimeType } = req.query as any;
        const profileId = req.profile!.id;
        const userId = req.user;

        let branchIdd: number;

        if (branchId && !isNaN(Number(branchId))) {
            branchIdd = Number(branchId);
        } else {
            branchIdd = req.branch!;
        }

        if (!branchIdd) {
            return errorHandler(res, "Invalid branch ID", 400);
        }

        const result = await BranchService.getBranchMedia(branchIdd, profileId, userId, { cursor, limit, mimeType });
        return successHandler(res, "Branch media fetched successfully", 200, result || {});
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch media", error.statusCode || 500, error);
    }
}

export const getBranchReviews = async (req: Request, res: Response) => {
    try {
        const { branchId, cursor, limit, search } = req.query as any;
        const profileId = req.profile!.id;
        const userId = req.user;

        let branchIdd: number;

        if (branchId && !isNaN(Number(branchId))) {
            branchIdd = Number(branchId);
        } else {
            branchIdd = req.branch!;
        }

        if (!branchIdd) {
            return errorHandler(res, "Invalid branch ID", 400);
        }

        const result = await BranchService.getBranchReviews(branchIdd, profileId, userId, { cursor, limit, search });
        return successHandler(res, "Branch reviews fetched successfully", 200, result || {});
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch reviews", error.statusCode || 500, error);
    }
}
