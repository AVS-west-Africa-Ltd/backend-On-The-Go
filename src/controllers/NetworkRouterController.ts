
import { Request, Response } from "express";
import { NetworkRouter } from "../models/NetworkRouter";
import * as Mikrotik from "../services/MikrotikService";
import { TicketProfile } from "../models/TicketProfile";
import { RouterOSClient } from "sy5-routeros-client";


export const addRouter = async (req: Request, res: Response) => {

    try {
        const { host, user, password } = req.body;
        const userID = req.user;
        let router = await NetworkRouter.findOne({
            where: { userId: userID },
        });

        if (router) {
            res.status(200).json({ messsage: "You have added router already" });
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

        return res.status(200).json({ router, message: "Network router added" });
    } catch (error: any) {
        console.log("Error adding router----", error);
        return res.status(400).json({ messsage: "Failed to add router." });
    }
};

export const fetchRouter = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const router = await NetworkRouter.findAll({
            where: { userId: userID }
        });
        return res.status(200).json({ router, message: "Router info fetched." });
    } catch (error: any) {
        console.log("Error fetching router info----", error)
        return res.status(400).json({ messsage: "Failed to fetch router info." });
    }
}

export const editRouter = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const { routerId, host, user, password } = req.body;
        const networkRouter = await NetworkRouter.findOne({ where: { id: routerId, userId: userID } });
        if (!networkRouter) {
            return res.status(200).json({ messsage: "Network router not found" });
        }
        await networkRouter.update({
            username: user,
            host,
            password
        });
        return res.status(200).json({ message: "Network router Info updated." });
    } catch (error: any) {
        console.log("Error updating network router info----", error);
        return res.status(400).json({ messsage: "Failed to update network router info." });
    }
}

export const checkRouterConnection = async (req: Request, res: Response) => {

    try {
        const userID = req.user;
        const router = await NetworkRouter.findOne({
            where: { userId: userID }
        });
        if (!router) {
            return res.status(400).json({ messsage: "Failed to check connection, router not found." });
        }

        const systemInfo = await Mikrotik.getSystemResource({ host: router.host, user: router.username, password: router.password });

        return res.status(200).json({ systemInfo, message: "Connection was established to router." });
    } catch (error: any) {
        console.log("Error checking router connection----", error);
        return res.status(400).json({ messsage: "Failed to update network router info." });
    }
}

export const syncProfiles = async (req: Request, res: Response) => {

    try {
        const userID = req.user;
        const router = await NetworkRouter.findOne({
            where: { userId: userID },
        });
        if (!router) {
            return res.status(400).json({ messsage: "Failed to sync ticket profiles, router not found." });
        }

        const profiles = await Mikrotik.fetchRouterProfile({
            host: router.host,
            user: router.username,
            password: router.password,
        });
        if (!profiles) {
            return res.status(400).json({ messsage: "Failed to sync ticket profiles." });
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

        // Wait for all operations to finish
        await Promise.all(profilePromises);

        return res.status(200).json({ profiles, message: "Ticket profile have been sync" });
    } catch (error) {
        console.log("Error syncing ticket profiles----", error);
        return res.status(400).json({ messsage: "Failed to sync ticket profiles." });
    }
};

export const editTicketProfile = async (req: Request, res: Response) => {

    try {
        const userID = req.user;
        const { profileId, title, description, bandwidth, status, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });

        if (!profile) {
            return res.status(400).json({ message: "Profile not found" });
        }

        await profile.update({
            title: title,
            description: description,
            bandwidth: bandwidth,
            price: amount,
            isActive: status
        });
        return res.status(200).json({ message: "Profile Info updated" });
    } catch (error) {
        console.log("Error updating profile info----", error);
        return res.status(400).json({ messsage: "Failed to update profile info." });
    }
}

export const addTicketPrice = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const { profileId, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            return res.status(400).json({ messsage: "Profile not found" });
        }
        await profile.update({ price: amount });
        return res.status(200).json({ message: "Profile price changed" });
    } catch (error) {
        console.log("Error changing profile price----", error);
        return res.status(400).json({ messsage: "Failed to change profile price." });
    }
}

export const changeTicketStatus = async (req: Request, res: Response) => {
    const { profileId, status } = req.body;
    const userID = req.user;
    try {
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
       await profile.update({ isActive: status });
        return res.status(200).json({ message: "Profile status changed" });
    } catch (error) {
        console.log("Error changing profile status----", error);
        return res.status(500).json({ messsage: "Failed to change profile status." });
    }
}

export const fetchTicketProfile = async (req: Request, res: Response) => {
    const userID = req.user;
    try {
        const profiles = await TicketProfile.findAll({
            where: { userId: userID }
        });
        res.status(200).json({ profiles, message: "Profile fetched." });
    } catch (error) {
        console.log(error)
        res.status(400).json({ messsage: "Failed to fetch ticket profile." });
    }
}

export const routerCommand = async (req: Request, res: Response) => {
    const { username } = req.query;
    let client: RouterOSClient | undefined;
    try {

        let { router, client } = await Mikrotik.connector({
          host: "192.168.88.1",
          user: "remote",
          password: "12345678",
        });
        const userManagerMenu = router.menu(
          "/tool user-manager user"
        );
        const user = await userManagerMenu.exec(`add`, {
          username,
          password: "12345678",
          customer: "operator",
        });
        const num = parseInt(user[0].ret.replace(/\D/g, ''), 10); // extract number only
        const result = num - 1;
        const profile = await userManagerMenu.exec("create-and-activate-profile", {
            customer: "operator",
            profile: "1HR",
            numbers: result
        })
        await client.close();
        res.status(200).json({ user, message: "Connection was establisshed to router." });
    } catch (error: any) {
        console.log("Error in [routerCommand]---", error);
        res.status(400).json({ messsage: error.message });
    } finally {
        if (client) await client.close();
    }
}


