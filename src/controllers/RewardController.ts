import { Request, Response } from "express";
import { errorHandler, successHandler } from "../handlers/responseHandlers";
import { RewardService } from "../services/reward.service";
import { Branch } from "../models/Branch";

export const createRule = async (req: Request, res: Response) => {
    try {
        const admin = req.admin!;
        const branchId = admin.branchId || req.body.branchId;

        const branch = await Branch.findByPk(branchId);
        if (!branch) {
            return errorHandler(res, "Branch not found", 404);
        }
        const businessId = branch.profileId;


        const rule = await RewardService.createRule({
            ...req.body,
            businessId,
            branchId
        });
        return successHandler(res, "Reward rule created successfully!", 201, rule);
    } catch (error: any) {
        console.error("Create reward rule failed:", error);
        return errorHandler(res, error.message || "Failed to create reward rule", 400, error);
    }
};

/**
 * Get active rules for a business or branch
 */
export const getRules = async (req: Request, res: Response) => {
    try {
        const admin = req.admin!;
        const branchId = admin.branchId;

        if (!branchId) {
            return errorHandler(res, "Branch ID is required", 400);
        }

        const branch = await Branch.findByPk(branchId);
        if (!branch) {
            return errorHandler(res, "Branch not found", 404);
        }
        const businessId = branch.profileId;

        const rules = await RewardService.getRules(businessId, branchId);
        return successHandler(res, "Reward rules fetched successfully!", 200, rules);
    } catch (error: any) {
        console.error("Fetch reward rules failed:", error);
        return errorHandler(res, error.message || "Failed to fetch reward rules", 400, error);
    }
};


export const getMyVouchers = async (req: Request, res: Response) => {
    try {
        const userId = req.user!;
        let businessId = req.admin!.businessId;

        if (!businessId) {
            const branch = await Branch.findByPk(req.admin!.branchId);
            if (branch) businessId = branch.profileId;
        }

        const vouchers = await RewardService.getUserVouchers(userId, businessId);
        return successHandler(res, "Your vouchers fetched successfully!", 200, { vouchers });
    } catch (error: any) {
        console.error("Fetch user vouchers failed:", error);
        return errorHandler(res, error.message || "Failed to fetch vouchers", 400, error);
    }
};

export const redeemVoucher = async (req: Request, res: Response) => {
    try {
        const userId = req.user!;
        const { voucherId } = req.body;
        const voucher = await RewardService.redeemVoucher(voucherId, userId);
        return successHandler(res, "Voucher redeemed successfully!", 200, voucher);
    } catch (error: any) {
        console.error("Redeem voucher failed:", error);
        return errorHandler(res, error.message || "Failed to redeem voucher", 400, error);
    }
};
/**
 * Get vouchers for a branch (Admin)
 */
export const getBranchVouchers = async (req: Request, res: Response) => {
    try {
        const admin = req.admin!;
        const branchId = admin.branchId;

        if (!branchId) {
            return errorHandler(res, "Branch ID is required", 400);
        }

        const { status, search } = req.query;
        const vouchers = await RewardService.getBranchVouchers(branchId, {
            status: status as any,
            search: search as string
        });
        return successHandler(res, "Branch vouchers fetched successfully!", 200, vouchers);
    } catch (error: any) {
        console.error("Fetch branch vouchers failed:", error);
        return errorHandler(res, error.message || "Failed to fetch branch vouchers", 400, error);
    }
};


export const manualIssueVoucher = async (req: Request, res: Response) => {
    try {
        const admin = req.admin!;
        const branchId = admin.branchId;

        const branch = await Branch.findByPk(branchId);
        if (!branch) {
            return errorHandler(res, "Branch not found", 404);
        }
        const businessId = branch.profileId;

        const voucher = await RewardService.manualIssueVoucher({
            ...req.body,
            businessId,
            branchId
        });
        return successHandler(res, "Voucher issued successfully!", 201, voucher);
    } catch (error: any) {
        console.error("Manual voucher issue failed:", error);
        return errorHandler(res, error.message || "Failed to issue voucher", 400, error);
    }
};
