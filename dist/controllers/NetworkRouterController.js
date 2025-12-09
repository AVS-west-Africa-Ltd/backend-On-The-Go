"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.routerCommand = exports.fetchTicketProfile = exports.changeTicketStatus = exports.addTicketPrice = exports.editTicketProfile = exports.syncProfiles = exports.checkRouterConnection = exports.editRouter = exports.fetchRouter = exports.addRouter = void 0;
const NetworkRouter_1 = require("../models/NetworkRouter");
const Mikrotik = __importStar(require("../services/MikrotikService"));
const TicketProfile_1 = require("../models/TicketProfile");
const addRouter = async (req, res) => {
    try {
        const { host, user, password } = req.body;
        const userID = req.user;
        let router = await NetworkRouter_1.NetworkRouter.findOne({
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
        router = await NetworkRouter_1.NetworkRouter.create({
            host,
            username: user,
            password,
            userId: userID,
            metadata: systemInfo,
        });
        return res.status(200).json({ router, message: "Network router added" });
    }
    catch (error) {
        console.log("Error adding router----", error);
        return res.status(400).json({ messsage: "Failed to add router." });
    }
};
exports.addRouter = addRouter;
const fetchRouter = async (req, res) => {
    const userID = req.user;
    try {
        const router = await NetworkRouter_1.NetworkRouter.findAll({
            where: { userId: userID }
        });
        return res.status(200).json({ router, message: "Router info fetched." });
    }
    catch (error) {
        console.log("Error fetching router info----", error);
        return res.status(400).json({ messsage: "Failed to fetch router info." });
    }
};
exports.fetchRouter = fetchRouter;
const editRouter = async (req, res) => {
    const userID = req.user;
    try {
        const { routerId, host, user, password } = req.body;
        const networkRouter = await NetworkRouter_1.NetworkRouter.findOne({ where: { id: routerId, userId: userID } });
        if (!networkRouter) {
            return res.status(200).json({ messsage: "Network router not found" });
        }
        await networkRouter.update({
            username: user,
            host,
            password
        });
        return res.status(200).json({ message: "Network router Info updated." });
    }
    catch (error) {
        console.log("Error updating network router info----", error);
        return res.status(400).json({ messsage: "Failed to update network router info." });
    }
};
exports.editRouter = editRouter;
const checkRouterConnection = async (req, res) => {
    try {
        const userID = req.user;
        const router = await NetworkRouter_1.NetworkRouter.findOne({
            where: { userId: userID }
        });
        if (!router) {
            return res.status(400).json({ messsage: "Failed to check connection, router not found." });
        }
        const systemInfo = await Mikrotik.getSystemResource({ host: router.host, user: router.username, password: router.password });
        return res.status(200).json({ systemInfo, message: "Connection was established to router." });
    }
    catch (error) {
        console.log("Error checking router connection----", error);
        return res.status(400).json({ messsage: "Failed to update network router info." });
    }
};
exports.checkRouterConnection = checkRouterConnection;
const syncProfiles = async (req, res) => {
    try {
        const userID = req.user;
        const router = await NetworkRouter_1.NetworkRouter.findOne({
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
        const profilePromises = profiles.map(async (profile) => {
            const ticketProfile = await TicketProfile_1.TicketProfile.findOne({
                where: { name: profile.name, routerId: router.id, userId: userID },
            });
            if (!ticketProfile) {
                return TicketProfile_1.TicketProfile.create({
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
    }
    catch (error) {
        console.log("Error syncing ticket profiles----", error);
        return res.status(400).json({ messsage: "Failed to sync ticket profiles." });
    }
};
exports.syncProfiles = syncProfiles;
const editTicketProfile = async (req, res) => {
    try {
        const userID = req.user;
        const { profileId, title, description, bandwidth, status, amount } = req.body;
        const profile = await TicketProfile_1.TicketProfile.findOne({ where: { id: profileId, userId: userID } });
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
    }
    catch (error) {
        console.log("Error updating profile info----", error);
        return res.status(400).json({ messsage: "Failed to update profile info." });
    }
};
exports.editTicketProfile = editTicketProfile;
const addTicketPrice = async (req, res) => {
    const userID = req.user;
    try {
        const { profileId, amount } = req.body;
        const profile = await TicketProfile_1.TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            return res.status(400).json({ messsage: "Profile not found" });
        }
        await profile.update({ price: amount });
        return res.status(200).json({ message: "Profile price changed" });
    }
    catch (error) {
        console.log("Error changing profile price----", error);
        return res.status(400).json({ messsage: "Failed to change profile price." });
    }
};
exports.addTicketPrice = addTicketPrice;
const changeTicketStatus = async (req, res) => {
    const { profileId, status } = req.body;
    const userID = req.user;
    try {
        const profile = await TicketProfile_1.TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }
        await profile.update({ isActive: status });
        return res.status(200).json({ message: "Profile status changed" });
    }
    catch (error) {
        console.log("Error changing profile status----", error);
        return res.status(500).json({ messsage: "Failed to change profile status." });
    }
};
exports.changeTicketStatus = changeTicketStatus;
const fetchTicketProfile = async (req, res) => {
    const userID = req.user;
    try {
        const profiles = await TicketProfile_1.TicketProfile.findAll({
            where: { userId: userID }
        });
        res.status(200).json({ profiles, message: "Profile fetched." });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ messsage: "Failed to fetch ticket profile." });
    }
};
exports.fetchTicketProfile = fetchTicketProfile;
const routerCommand = async (req, res) => {
    const { username } = req.query;
    let client;
    try {
        let { router, client } = await Mikrotik.connector({
            host: "192.168.88.1",
            user: "remote",
            password: "12345678",
        });
        const userManagerMenu = router.menu("/tool user-manager user");
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
        });
        await client.close();
        res.status(200).json({ user, message: "Connection was establisshed to router." });
    }
    catch (error) {
        console.log("Error in [routerCommand]---", error);
        res.status(400).json({ messsage: error.message });
    }
    finally {
        if (client)
            await client.close();
    }
};
exports.routerCommand = routerCommand;
