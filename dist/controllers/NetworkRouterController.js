const { NetworkRouter, TicketProfile } = require('../models');
const Mikrotik = require("../services/MikrotikService");
exports.addRouter = async (req, res) => {
    try {
        const { host, user, password } = req.body;
        const userID = req.userId;
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
        res.status(200).json({ router, message: "Network router added" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to add router." });
    }
};
exports.fetchRouter = async (req, res) => {
    const userID = req.userId;
    try {
        const router = await NetworkRouter.findAll({
            where: { userId: userID }
        });
        res.status(200).json({ router, message: "Router info fetched." });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to fetch router info." });
    }
};
exports.editRouter = async (req, res) => {
    const userID = req.userId;
    try {
        const { routerId, host, user, password } = req.body;
        const networkRouter = await NetworkRouter.findOne({ where: { id: routerId, userId: userID } });
        if (!networkRouter) {
            res.status(200).json({ messsage: "Network router not found" });
        }
        await networkRouter.update({
            username: user,
            host,
            password
        });
        res.status(200).json({ message: "Network router Info updated." });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to update network router info." });
    }
};
exports.checkRouterConnection = async (req, res) => {
    try {
        const userID = req.userId;
        const router = await NetworkRouter.findOne({
            where: { userId: userID }
        });
        if (!router) {
            res.status(400).json({ messsage: "Failed to check connection, router not found." });
        }
        const systemInfo = await Mikrotik.getSystemResource({ host: router.host, user: router.username, password: router.password });
        res.status(200).json({ systemInfo, message: "Connection was established to router." });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to update network router info." });
    }
};
exports.syncProfiles = async (req, res) => {
    try {
        const userID = req.userId;
        const router = await NetworkRouter.findOne({
            where: { userId: userID },
        });
        if (!router) {
            res.status(400).json({ messsage: "Failed to sync ticket profiles, router not found." });
        }
        const profiles = await Mikrotik.fetchProfile({
            host: router.host,
            user: router.username,
            password: router.password,
        });
        if (!profiles) {
            res.status(400).json({ messsage: "Failed to sync ticket profiles." });
        }
        profiles.forEach(async (profile) => {
            const ticketProfile = await TicketProfile.findOne({
                where: { name: profile.name, routerId: router.id, userId: userID },
            });
            if (!ticketProfile) {
                await TicketProfile.create({
                    name: profile.name,
                    price: 0,
                    routerId: router.id,
                    userId: userID,
                    owner: profile.owner,
                });
            }
        });
        res.status(200).json({ profiles, message: "Ticket profile have been sync" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to sync ticket profiles." });
    }
};
exports.editTicketProfile = async (req, res) => {
    try {
        const userID = req.userId;
        const { profileId, title, description, bandwidth, status, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        await profile.update({
            title: title,
            description: description,
            bandwidth: bandwidth,
            price: amount,
            isActive: status
        });
        res.status(200).json({ message: "Profile Info updated" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to update profile info." });
    }
};
exports.addTicketPrice = async (req, res) => {
    const userID = req.userId;
    try {
        const { profileId, amount } = req.body;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            res.status(400).json({ messsage: "Failed profile not found" });
        }
        await profile.update({ price: amount });
        res.status(200).json({ message: "Profile price changed" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to change profile price." });
    }
};
exports.changeTicketStatus = async (req, res) => {
    const { profileId, status } = req.body;
    const userID = req.userId;
    try {
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            res.status(400).json({ message: "Failed profile not found" });
        }
        profile.isActive = status;
        await profile.save();
        res.status(200).json({ message: "Profile status changed" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to change profile status." });
    }
};
exports.fetchTicketProfile = async (req, res) => {
    const userID = req.userId;
    try {
        const profiles = await TicketProfile.findAll({
            where: { userId: userID }
        });
        res.status(200).json({ profiles, message: "Profile fetched." });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to fetch ticket profile." });
    }
};
exports.routerCommand = async (req, res) => {
    const { username } = req.query;
    let client;
    try {
        client = await RouterConnect.connector({ host: "192.168.88.1", user: "remote", password: "12345678" });
        const userManagerMenu = await client.router.menu('/tool user-manager user');
        const user = await userManagerMenu.exec(`add`, {
            username,
            password: "12345678",
            customer: "operator"
        });
        const num = parseInt(user[0].ret.replace(/\D/g, ''), 10); // extract number only
        const result = num - 1;
        const profile = await userManagerMenu.exec("create-and-activate-profile", {
            customer: "operator",
            profile: "1HR",
            numbers: result
        });
        await client.api.close();
        res.status(200).json({ user, message: "Connection was establisshed to router." });
    }
    catch (error) {
        if (client && client.api)
            await client.api.close();
        console.log(error);
        res.status(400).json({ messsage: error.message });
    }
};
