import { Request, Response } from "express";
import { PlatformAdminService } from "../services/platformAdmin.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export class PlatformAdminController {
    static async getAllUsers(req: Request, res: Response) {
        try {
            const users = await PlatformAdminService.getAllUsers(req.query);
            return successHandler(res, "Users fetched successfully", 200, users);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch users", error.status || 500);
        }
    }

    static async getAllBusinesses(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllBusinesses(req.query);
            return successHandler(res, "Businesses fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch businesses", error.status || 500);
        }
    }

    static async getAllBranches(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllBranches(req.query);
            return successHandler(res, "Branches fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch branches", error.status || 500);
        }
    }

    static async getAllProducts(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllProducts(req.query);
            return successHandler(res, "Products fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch products", error.status || 500);
        }
    }

    static async getAllOrders(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllOrders(req.query);
            return successHandler(res, "Orders fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch orders", error.status || 500);
        }
    }

    static async getAllReviews(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllReviews(req.query);
            return successHandler(res, "Reviews fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch reviews", error.status || 500);
        }
    }

    static async getAllPosts(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllPosts(req.query);
            return successHandler(res, "Posts fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch posts", error.status || 500);
        }
    }

    static async getAllCommunities(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllCommunities(req.query);
            return successHandler(res, "Communities fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch communities", error.status || 500);
        }
    }

    static async getAllInsights(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllInsights(req.query);
            return successHandler(res, "Insights fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch insights", error.status || 500);
        }
    }

    static async getAllRewards(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllRewards(req.query);
            return successHandler(res, "Rewards fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch rewards", error.status || 500);
        }
    }

    static async getAllVouchers(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllVouchers(req.query);
            return successHandler(res, "Vouchers fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch vouchers", error.status || 500);
        }
    }

    static async getAllWifiProfiles(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllWifiProfiles(req.query);
            return successHandler(res, "Wifi profiles fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch wifi profiles", error.status || 500);
        }
    }

    static async getAllWifiTickets(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllWifiTickets(req.query);
            return successHandler(res, "Wifi tickets fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch wifi tickets", error.status || 500);
        }
    }

    static async getAllWifiVouchers(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllWifiVouchers(req.query);
            return successHandler(res, "Wifi vouchers fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch wifi vouchers", error.status || 500);
        }
    }

    static async getAllSettings(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.getAllSettings(req.query);
            return successHandler(res, "Settings fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to fetch settings", error.status || 500);
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const data = await PlatformAdminService.login(req.body);
            return successHandler(res, "Login successful", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Login failed", error.status || 401);
        }
    }

    static async changePassword(req: Request, res: Response) {
        try {
            const admin = req.admin;
            if (!admin || !admin.id) {
                return errorHandler(res, "Admin not authenticated", 401);
            }
            const data = await PlatformAdminService.changePassword(admin.id as number, req.body);
            return successHandler(res, data.message, 200);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to change password", error.status || 400);
        }
    }
}
