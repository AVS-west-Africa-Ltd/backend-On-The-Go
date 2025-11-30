const RouterOSClient = require('sy5-routeros-client').RouterOSClient;
const { NetworkRouter } = require('../models');
const { RandomCharacters } = require('../helpers');
exports.getSystemResource = async (credentials) => {
    let client;
    try {
        client = new RouterOSClient(credentials);
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
exports.fetchProfile = async (credentials) => {
    let client;
    try {
        client = new RouterOSClient(credentials);
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
exports.generateTicket = async (ticketProfile) => {
    let client;
    try {
        // Fetch router from DB
        const networkRouter = await NetworkRouter.findOne({
            where: { id: ticketProfile.routerId },
        });
        if (!networkRouter)
            throw new Error("Failed to fetch network router.");
        const credentials = {
            host: networkRouter.host,
            user: networkRouter.username,
            password: networkRouter.password,
        };
        client = new RouterOSClient(credentials);
        const router = await client.connect();
        // Add new user in User Manager
        const userManagerMenu = router.menu("/tool/user-manager/user");
        const ticketInfo = { username: RandomCharacters(6), password: RandomCharacters(6) };
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
