import axios from 'axios';
import { MikrotikRouter } from "../models/MikrotikRouter";
import { TicketProfile } from "../models/TicketProfile";

export class MikrotikService {
    private static get baseUrl() {
        return process.env.MIKROTIK_CLOUD_BASE_API;
    }

    static async checkConnection(data: any) {
        const response = await axios.post(`${this.baseUrl}/check-connection`, data);
        return response.data;
    }

    static async syncTicketProfiles(data: any) {
        const response = await axios.post(`${this.baseUrl}/profiles`, data);
        return response.data;
    }

    static async createAndActivateTicket(data: any) {
        const response = await axios.post(`${this.baseUrl}/users`, data);
        return response.data;
    }

    static async addRouter(data: { host: any; user: any; password: any; profileId: any; }) {
        const { host, user, password, profileId } = data;
        const router = await MikrotikRouter.findOne({
            where: { profileId: profileId },
        });

        if (router) {
            throw new Error("You have added router already");
        }

        const systemInfo = await this.checkConnection({
            host,
            user,
            password,
        });

        return await MikrotikRouter.create({
            host,
            username: user,
            password,
            profileId: profileId,
            metadata: systemInfo,
        });
    }

    static async fetchRouter(profileId: number) {
        return await MikrotikRouter.findAll({
            where: { profileId: profileId }
        });
    }

    static async editRouter(data: { routerId: any; host: any; user: any; password: any; profileId: any; }) {
        const { routerId, host, user, password, profileId } = data;
        const networkRouter = await MikrotikRouter.findOne({ where: { id: routerId, profileId: profileId } });
        if (!networkRouter) {
            throw new Error("Network router not found");
        }
        await networkRouter.update({
            username: user,
            host,
            password
        });
        return networkRouter;
    }

    static async checkRouterConnection(profileId: number) {
        const router = await MikrotikRouter.findOne({
            where: { profileId: profileId }
        });
        if (!router) {
            throw new Error("Failed to check connection, router not found.");
        }

        return await this.checkConnection({ host: router.host, user: router.username, password: router.password });
    }

    static async syncProfiles(data: { profileId: any; userID: any; }) {
        const { profileId, userID } = data;
        const router = await MikrotikRouter.findOne({
            where: { profileId: profileId },
        });
        if (!router) {
            throw new Error("Failed to sync ticket profiles, router not found.");
        }

        const profiles = await this.syncTicketProfiles({
            host: router.host,
            user: router.username,
            password: router.password,
        });

        if (!profiles) {
            throw new Error("Failed to sync ticket profiles.");
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

        return await Promise.all(profilePromises);
    }

    static async editTicketProfile(data: { userID: any; profileId: any; title: any; description: any; bandwidth: any; status: any; amount: any; }) {
        const { userID, profileId, title, description, bandwidth, status, amount } = data;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });

        if (!profile) {
            throw new Error("Profile not found");
        }

        await profile.update({
            title: title,
            description: description,
            bandwidth: bandwidth,
            price: amount,
            isActive: status
        });
        return profile;
    }

    static async addTicketPrice(data: { userID: any; profileId: any; amount: any; }) {
        const { userID, profileId, amount } = data;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        await profile.update({ price: amount });
        return profile;
    }

    static async changeTicketStatus(data: { userID: any; profileId: any; status: any; }) {
        const { userID, profileId, status } = data;
        const profile = await TicketProfile.findOne({ where: { id: profileId, userId: userID } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        await profile.update({ isActive: status });
        return profile;
    }

    static async fetchTicketProfile(userID: number) {
        return await TicketProfile.findAll({
            where: { userId: userID }
        });
    }

    static async routerCommand(data: { username: any; }) {
        // Implementation pending replacement of sy5-routeros-client
        return { username: data.username };
    }
}
