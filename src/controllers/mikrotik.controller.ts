import { Request, Response } from "express";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { MikrotikService } from "../services/mikrotik.service";

export const addRouter = async (req: Request, res: Response) => {
    try {
        const { host, user, password, profileId, branchId } = req.body;
        const router = await MikrotikService.addRouter({ host, user, password, profileId: Number(profileId), branchId: Number(branchId) });
        return successHandler(res, "Network router added", 200, router);
    } catch (error: any) {
        console.log("Error adding router----", error);
        if (error.message === "You have added router already") {
            return successHandler(res, error.message, 200);
        }
        return errorHandler(res, "Failed to add router.", 400);
    }
};

export const fetchRouter = async (req: Request, res: Response) => {
    const { profileId, branchId } = req.query;
    try {
        const router = await MikrotikService.fetchRouter(Number(profileId), Number(branchId));
        return successHandler(res, "Router info fetched.", 200, router);
    } catch (error: any) {
        console.log("Error fetching router info----", error)
        return errorHandler(res, "Failed to fetch router info.", 400);
    }
}

export const editRouter = async (req: Request, res: Response) => {
    try {
        const { routerId, host, user, password, profileId, branchId } = req.body;
        await MikrotikService.editRouter({ routerId: Number(routerId), host, user, password, profileId: Number(profileId), branchId: Number(branchId) });
        return successHandler(res, "Network router Info updated.", 200);
    } catch (error: any) {
        console.log("Error updating network router info----", error);
        if (error.message === "Network router not found") {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to update network router info.", 400);
    }
}

export const checkRouterConnection = async (req: Request, res: Response) => {
    try {
        const { profileId, branchId } = req.query;
        const systemInfo = await MikrotikService.checkRouterConnection(Number(profileId), Number(branchId));
        return successHandler(res, "Connection was established to router.", 200, systemInfo);
    } catch (error: any) {
        console.log("Error checking router connection----", error);
        if (error.message === "Failed to check connection, router not found.") {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to update network router info.", 400);
    }
}

export const syncProfiles = async (req: Request, res: Response) => {
    try {
        const { profileId, branchId } = req.body;
        const userID = req.user;
        const profiles = await MikrotikService.syncProfiles({ profileId: Number(profileId), branchId: Number(branchId), userID: Number(userID) });
        return successHandler(res, "Ticket profile have been sync", 200, profiles);
    } catch (error: any) {
        console.log("Error syncing ticket profiles----", error);
        if (error.message.includes("not found")) {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to sync ticket profiles.", 400);
    }
};

export const editTicketProfile = async (req: Request, res: Response) => {
    try {
        const { profileId: ticketProfileId, branchId, title, description, bandwidth, status, amount } = req.body;
        const ownerProfileId = req.profile!.id;
        await MikrotikService.editTicketProfile({ ticketProfileId: Number(ticketProfileId), profileId: Number(ownerProfileId), branchId: Number(branchId), title, description, bandwidth, status, amount });
        return successHandler(res, "Profile Info updated", 200);
    } catch (error: any) {
        console.log("Error updating profile info----", error);
        if (error.message === "Profile not found") {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to update profile info.", 400);
    }
}

export const addTicketPrice = async (req: Request, res: Response) => {
    try {
        const { profileId: ticketProfileId, branchId, amount } = req.body;
        const ownerProfileId = req.profile!.id;
        await MikrotikService.addTicketPrice({ ticketProfileId: Number(ticketProfileId), profileId: Number(ownerProfileId), branchId: Number(branchId), amount });
        return successHandler(res, "Profile price changed", 200);
    } catch (error: any) {
        console.log("Error changing profile price----", error);
        if (error.message === "Profile not found") {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to change profile price.", 400);
    }
}

export const changeTicketStatus = async (req: Request, res: Response) => {
    try {
        const { profileId: ticketProfileId, branchId, status } = req.body;
        const ownerProfileId = req.profile!.id;
        await MikrotikService.changeTicketStatus({ ticketProfileId: Number(ticketProfileId), profileId: Number(ownerProfileId), branchId: Number(branchId), status });
        return successHandler(res, "Profile status changed", 200);
    } catch (error: any) {
        console.log("Error changing profile status----", error);
        if (error.message === "Profile not found") {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to change profile status.", 500);
    }
}

export const fetchTicketProfile = async (req: Request, res: Response) => {
    try {
        const ownerProfileId = req.profile!.id;
        const { branchId } = req.query;
        const profiles = await MikrotikService.fetchTicketProfile(Number(ownerProfileId), Number(branchId));
        return successHandler(res, "Profile fetched.", 200, profiles);
    } catch (error) {
        console.log(error)
        return errorHandler(res, "Failed to fetch ticket profile.", 400);
    }
}

export const ensureTicketProfileProduct = async (req: Request, res: Response) => {
    try {
        const { profileId: ticketProfileId, branchId, branchAmenityId } = req.body;
        const ownerProfileId = req.profile!.id;

        const product = await MikrotikService.ensureTicketProfileProduct({
            ticketProfileId: Number(ticketProfileId),
            profileId: Number(ownerProfileId),
            branchId: Number(branchId),
            branchAmenityId,
        });

        return successHandler(res, "Ticket profile product ensured.", 200, product);
    } catch (error: any) {
        console.log("Error ensuring ticket profile product----", error);
        if (error.message && error.message.includes("not found")) {
            return errorHandler(res, error.message, 404);
        }
        return errorHandler(res, "Failed to ensure ticket profile product.", 400);
    }
}
