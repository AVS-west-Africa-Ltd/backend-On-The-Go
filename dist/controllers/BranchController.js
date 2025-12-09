"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBranchStatus = exports.deleteBranch = exports.getBranch = exports.getBranches = exports.create = void 0;
const branches_service_1 = require("../services/branches.service");
const responseHandlers_1 = require("../handlers/responseHandlers");
const create = async (req, res) => {
    try {
        const value = req.body;
        const input = value;
        const profileId = req.profile.id;
        const userId = req.user;
        const branchData = await branches_service_1.BranchService.createBranch(input, {
            profileId,
            userId
        });
        return (0, responseHandlers_1.successHandler)(res, "Branch created successfully", 201, branchData);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to create branch", 500, error);
    }
};
exports.create = create;
const getBranches = async (req, res) => {
    try {
        const { cursor, limit = "10", search = "" } = req.query;
        const profileId = req.profile.id;
        const userId = req.user;
        const { branches, total, nextCursor } = await branches_service_1.BranchService.getBranches({
            cursor: cursor,
            limit: parseInt(limit, 10),
            search: search
        }, {
            profileId,
            userId
        });
        return (0, responseHandlers_1.successHandler)(res, "Branches fetched successfully", 200, {
            branches,
            total,
            nextCursor,
            limit: parseInt(limit, 10)
        });
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to fetch branches", 500, error);
    }
};
exports.getBranches = getBranches;
const getBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile.id;
        const userId = req.user;
        if (!branchId) {
            return (0, responseHandlers_1.errorHandler)(res, "branchId is required", 400);
        }
        const branch = await branches_service_1.BranchService.getBranchById(parseInt(branchId, 10), profileId, userId);
        if (!branch) {
            return (0, responseHandlers_1.errorHandler)(res, "Branch not found", 404);
        }
        return (0, responseHandlers_1.successHandler)(res, "Branch fetched successfully", 200, branch);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to fetch branch", 500, error);
    }
};
exports.getBranch = getBranch;
const deleteBranch = async (req, res) => {
    try {
        const { branchId } = req.params;
        const profileId = req.profile.id;
        if (!branchId) {
            return (0, responseHandlers_1.errorHandler)(res, "branchId is required", 400);
        }
        const deleted = await branches_service_1.BranchService.deleteBranch(parseInt(branchId, 10), profileId);
        if (!deleted) {
            return (0, responseHandlers_1.errorHandler)(res, "Branch could not be deleted", 404);
        }
        return (0, responseHandlers_1.successHandler)(res, "Branch deleted successfully", 200);
    }
    catch (error) {
        console.error("Failed to delete branch:", error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Something went wrong while deleting the branch", 500, error);
    }
};
exports.deleteBranch = deleteBranch;
const updateBranchStatus = async (req, res) => {
    try {
        const { branchId } = req.params;
        if (!branchId) {
            return (0, responseHandlers_1.errorHandler)(res, "branchId is required", 400);
        }
        const updated = await branches_service_1.BranchService.updateBranchStatus(parseInt(branchId, 10), req.profile.id);
        if (!updated) {
            return (0, responseHandlers_1.errorHandler)(res, "Branch status could not be updated", 404);
        }
        return (0, responseHandlers_1.successHandler)(res, "Branch status updated successfully", 200);
    }
    catch (error) {
        console.error("Failed to update branch status:", error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Something went wrong while updating the branch status", 500, error);
    }
};
exports.updateBranchStatus = updateBranchStatus;
