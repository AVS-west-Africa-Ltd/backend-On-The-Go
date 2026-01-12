import { Request, Response } from "express";
import { NetworkRouter } from "../models/NetworkRouter";
import * as Mikrotik from "../services/MikrotikService";
import { TicketProfile } from "../models/TicketProfile";
import { RouterOSClient } from "sy5-routeros-client";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export const addRouter = async (req: Request, res: Response) => {
    try {
        const { host, user, password } = req.body;
        const userID = req.user;
        let router = await NetworkRouter.findOne({
            where: { userId: userID },
        });

        if (router) {
            return successHandler(res, "You have added router already", 200);
        }

        const systemInfo = await Mikrotik.getSystemResource({
            host,
            user,
            password,
        });

        router = await NetworkRouter.create({
            host,
            username: user,
            password,
            userId: userID,
            metadata: systemInfo,
        });

        return successHandler(res, "Network router added", 200, router);
    } catch (error: any) {
        console.log("Error adding router----", error);
        return errorHandler(res, "Failed to add router.", 400);
    }
};

export const fetchRouter = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const router = await NetworkRouter.findAll({
            where: { userId: userID }
        });
        return successHandler(res, "Router info fetched.", 200, router);
    } catch (error: any) {
        console.log("Error fetching router info----", error)
        return errorHandler(res, "Failed to fetch router info.", 400);
    }
}

export const editRouter = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const { routerId, host, user, password } = req.body;
        const networkRouter = await NetworkRouter.findOne({ where: { id: routerId, userId: userID } });
        if (!networkRouter) {
            return errorHandler(res, "Network router not found", 404);
        }
        await networkRouter.update({
            username: user,
            host,
            password
        });
        return successHandler(res, "Network router Info updated.", 200);
    } catch (error: any) {
        console.log("Error updating network router info----", error);
        return errorHandler(res, "Failed to update network router info.", 400);
    }
}

export const checkRouterConnection = async (req: Request, res: Response) => {
    try {
        const userID = req.user;
        const router = await NetworkRouter.findOne({
            where: { userId: userID }
        });
        if (!router) {
            return errorHandler(res, "Failed to check connection, router not found.", 404);
        }

        const systemInfo = await Mikrotik.getSystemResource({ host: router.host, user: router.username, password: router.password });

        return successHandler(res, "Connection was established to router.", 200, systemInfo);
    } catch (error: any) {
        console.log("Error checking router connection----", error);
        return errorHandler(res, "Failed to update network router info.", 400);
    }
}

export const syncProfiles = async (req: Request, res: Response) => {
    try {
        const userID = req.user;
        const router = await NetworkRouter.findOne({
            where: { userId: userID },
        });
        if (!router) {
            return errorHandler(res, "Failed to sync ticket profiles, router not found.", 404);
        }

        const profiles = await Mikrotik.fetchRouterProfile({
            host: router.host,
            user: router.username,
            password: router.password,
        });
        if (!profiles) {
            return errorHandler(res, "Failed to sync ticket profiles.", 400);
        }
        const profilePromises = profiles.map(async (profile: any) => {
            const ticketProfile = await TicketProfile.findOne({
                where: { name: profile.name, routerId: router.id, userId: userID },
            });

            if (!ticketProfile) {
                return TicketProfile.create({
                    name: profile.name,
                    price: 0,
                    routerId: router.id,
                    userId: userID,
                    owner: profile.owner,
                });
            }

            return ticketProfile;
        });

        await Promise.all(profilePromises);

        return successHandler(res, "Ticket profile have been sync", 200, profiles);
    } catch (error) {
        console.log("Error syncing ticket profiles----", error);
        return errorHandler(res, "Failed to sync ticket profiles.", 400);
    }
};

export const editTicketProfile = async (req: Request, res: Response) => {
    try {
        const userID = req.user;
        const { profileId, title, description, bandwidth, status, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });

        if (!profile) {
            return errorHandler(res, "Profile not found", 404);
        }

        await profile.update({
            title: title,
            description: description,
            bandwidth: bandwidth,
            price: amount,
            isActive: status
        });
        return successHandler(res, "Profile Info updated", 200);
    } catch (error) {
        console.log("Error updating profile info----", error);
        return errorHandler(res, "Failed to update profile info.", 400);
    }
}

export const addTicketPrice = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const { profileId, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            return errorHandler(res, "Profile not found", 404);
        }
        await profile.update({ price: amount });
        return successHandler(res, "Profile price changed", 200);
    } catch (error) {
        console.log("Error changing profile price----", error);
        return errorHandler(res, "Failed to change profile price.", 400);
    }
}

export const changeTicketStatus = async (req: Request, res: Response) => {
    const { profileId, status } = req.body;
    const userID = req.user;
    try {
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            return errorHandler(res, "Profile not found", 404);
        }
        await profile.update({ isActive: status });
        return successHandler(res, "Profile status changed", 200);
    } catch (error) {
        console.log("Error changing profile status----", error);
        return errorHandler(res, "Failed to change profile status.", 500);
    }
}

export const fetchTicketProfile = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const profiles = await TicketProfile.findAll({
            where: { userId: userID }
        });
        return successHandler(res, "Profile fetched.", 200, profiles);
    } catch (error) {
        console.log(error)
        return errorHandler(res, "Failed to fetch ticket profile.", 400);
    }
}

export const routerCommand = async (req: Request, res: Response) => {
    const { username } = req.query;
    let client: RouterOSClient | undefined;
    try {

        let { router, client: mikrotikClient } = await Mikrotik.connector({
            host: "192.168.88.1",
            user: "remote",
            password: "12345678",
        });
        client = mikrotikClient;
        const userManagerMenu = router.menu(
            "/tool user-manager user"
        );
        const user = await userManagerMenu.exec(`add`, {
            username,
            password: "12345678",
            customer: "operator",
        });
        const num = parseInt(user[0].ret.replace(/\D/g, ''), 10);
        const result = num - 1;
        const profile = await userManagerMenu.exec("create-and-activate-profile", {
            customer: "operator",
            profile: "1HR",
            numbers: result
        })
        await client.close();
        return successHandler(res, "Connection was established to router.", 200, user);
    } catch (error: any) {
        console.log("Error in [routerCommand]---", error);
        return errorHandler(res, error.message, 400);
    } finally {
        if (client) await client.close();
    }
}


