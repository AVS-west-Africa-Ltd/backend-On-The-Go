"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connector = exports.generateTicket = exports.fetchRouterProfile = exports.getSystemResource = void 0;
// services/routerOsService.ts
const sy5_routeros_client_1 = require("sy5-routeros-client");
const helpers_1 = require("../utils/helpers");
const NetworkRouter_1 = require("../models/NetworkRouter");
const getSystemResource = async (credentials) => {
    let client;
    try {
        client = new sy5_routeros_client_1.RouterOSClient(credentials);
        const router = await client.connect();
        const systemInfo = await router.menu("/system/resource").getOnly();
        if (!systemInfo)
            throw new Error("Failed to fetch system resource.");
        return systemInfo;
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to fetch system resource.");
    }
    finally {
        if (client)
            await client.close();
    }
};
exports.getSystemResource = getSystemResource;
const fetchRouterProfile = async (credentials) => {
    let client;
    try {
        client = new sy5_routeros_client_1.RouterOSClient(credentials);
        const router = await client.connect();
        const profiles = await router.menu("/tool/user-manager/profile").getAll();
        if (!profiles)
            throw new Error("Failed to fetch profiles.");
        return profiles;
    }
    catch (error) {
        console.error(error);
        throw new Error("Failed to fetch profiles.");
    }
    finally {
        if (client)
            await client.close();
    }
};
exports.fetchRouterProfile = fetchRouterProfile;
const generateTicket = async (ticketProfile) => {
    let client;
    try {
        // Fetch router from DB
        const networkRouter = await NetworkRouter_1.NetworkRouter.findOne({
            where: { id: ticketProfile.routerId },
        });
        if (!networkRouter)
            throw new Error("Failed to fetch network router.");
        const credentials = {
            host: networkRouter.host,
            user: networkRouter.username,
            password: networkRouter.password,
        };
        client = new sy5_routeros_client_1.RouterOSClient(credentials);
        const router = await client.connect();
        // Add new user in User Manager
        const userManagerMenu = router.menu("/tool/user-manager/user");
        const ticketInfo = { username: (0, helpers_1.randomCharacters)(6), password: (0, helpers_1.randomCharacters)(6) };
        const ticket = await userManagerMenu.add({
            ...ticketInfo,
            customer: ticketProfile.owner,
        });
        // Activate profile
        await userManagerMenu.exec("create-and-activate-profile", {
            customer: ticketProfile.owner,
            profile: ticketProfile.name,
            numbers: ticket.id,
        });
        return ticketInfo;
    }
    catch (error) {
        console.error("Ticket generation failed:", error);
        throw new Error("Failed to generate ticket.");
    }
    finally {
        if (client)
            await client.close();
    }
};
exports.generateTicket = generateTicket;
const connector = async (credentials) => {
    const client = new sy5_routeros_client_1.RouterOSClient(credentials);
    const router = await client.connect();
    return { router, client };
};
exports.connector = connector;
