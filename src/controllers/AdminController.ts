import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export const login = async (req: Request, res: Response) => {
    try {
        const { admin, token } = await AdminService.login(req.body);
        return successHandler(res, "Admin logged in successfully", 200, { admin, token });
    } catch (error: any) {
        return errorHandler(res, error.message || "Login failed", 401, error);
    }
};

export const createAdmin = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const admin = await AdminService.createAdmin(req.body, profileId);
        return successHandler(res, "Admin created successfully", 201, admin);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to create admin", 400, error);
    }
};

export const getAdmins = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { branchId } = req.query;
        const admins = await AdminService.getAdmins(profileId, branchId ? Number(branchId) : undefined);
        return successHandler(res, "Admins fetched successfully", 200, admins);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch admins", 400);
    }
};

export const getAdminById = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { id } = req.params;
        const admin = await AdminService.getAdminById(Number(id), profileId);
        return successHandler(res, "Admin fetched successfully", 200, admin);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch admin", 400);
    }
};

export const updateAdmin = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { id } = req.params;
        const admin = await AdminService.updateAdmin(Number(id), profileId, req.body);
        return successHandler(res, "Admin updated successfully", 200, admin);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to update admin", 400);
    }
};

export const deleteAdmin = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { id } = req.params;
        await AdminService.deleteAdmin(Number(id), profileId);
        return successHandler(res, "Admin deleted successfully", 200);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to delete admin", 400);
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { id } = req.params;
        const { role } = req.body;
        const admin = await AdminService.updateRole(Number(id), profileId, role);
        return successHandler(res, "Admin role updated successfully", 200, admin);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to update role", 400);
    }
};

export const updatePermissions = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const { id } = req.params;
        const { permissions } = req.body;
        const admin = await AdminService.updatePermissions(Number(id), profileId, permissions);
        return successHandler(res, "Admin permissions updated successfully", 200, admin);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to update permissions", 400);
    }
};

export const getAllPermissions = async (req: Request, res: Response) => {
    try {
        const permissions = await AdminService.getAllPermissions();
        return successHandler(res, "Permissions fetched successfully", 200, permissions);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch permissions", 400);
    }
};

export const getAllRoles = async (req: Request, res: Response) => {
    try {
        const roles = await AdminService.getAllRoles();
        return successHandler(res, "Roles fetched successfully", 200, roles);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch roles", 400);
    }
};
