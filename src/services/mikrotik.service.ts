import axios from 'axios';
import { MikrotikRouter } from "../models/mikrotikRouter.model";
import { TicketProfile } from "../models/ticketProfile.model";
import { Product } from "../models/product.model";
import { BranchAmenity } from "../models/branchAmenity.model";
import { Status } from "../models/types/amenity.types";
import { ProductStatus } from "../models/types/product.types";

export class MikrotikService {
    private static get baseUrl() {
        return process.env.MIKROTIK_CLOUD_BASE_API;
    }

    static async checkConnection(data: { host: string; user: string; password: string }) {
        const response = await axios.post(`${this.baseUrl}/check-connection`, data);
        return response.data;
    }

    static async syncTicketProfiles(data: { host: string; user: string; password: string }) {
        const response = await axios.post(`${this.baseUrl}/profiles`, data);
        return response.data;
    }

    static async createAndActivateTicket(data: Record<string, unknown>) {
        const response = await axios.post(`${this.baseUrl}/users`, data);
        return response.data;
    }

    static async addRouter(data: { host: string; user: string; password: string; profileId: number; branchId: number; }) {
        const { host, user, password, profileId, branchId } = data;
        const router = await MikrotikRouter.findOne({
            where: { profileId, branchId },
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
            profileId,
            branchId,
            metadata: systemInfo,
        });
    }

    static async fetchRouter(profileId: number, branchId: number) {
        return await MikrotikRouter.findAll({
            where: { profileId, branchId }
        });
    }

    static async editRouter(data: { routerId: number; host: string; user: string; password: string; profileId: number; branchId: number; }) {
        const { routerId, host, user, password, profileId, branchId } = data;
        const networkRouter = await MikrotikRouter.findOne({ where: { id: routerId, profileId, branchId } });
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

    static async checkRouterConnection(profileId: number, branchId: number) {
        const router = await MikrotikRouter.findOne({
            where: { profileId, branchId }
        });
        if (!router) {
            throw new Error("Failed to check connection, router not found.");
        }

        return await this.checkConnection({ host: router.host, user: router.username, password: router.password });
    }

    static async syncProfiles(data: { profileId: number; branchId: number; userID: number; }) {
        const { profileId, branchId, userID } = data;
        const router = await MikrotikRouter.findOne({
            where: { profileId, branchId },
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
        const profilePromises = (profiles as Array<{ name: string; owner?: string }>).map(async (profile) => {
            const ticketProfile = await TicketProfile.findOne({
                where: { name: profile.name, routerId: router.id, profileId, branchId },
            });

            if (!ticketProfile) {
                return TicketProfile.create({
                    name: profile.name,
                    price: 0,
                    routerId: router.id,
                    profileId,
                    branchId,
                    owner: profile.owner,
                });
            }

            return ticketProfile;
        });

        return await Promise.all(profilePromises);
    }

    static async editTicketProfile(data: { ticketProfileId: number; profileId: number; branchId: number; title: string; description: string; bandwidth: string; status: boolean; amount: number; }) {
        const { ticketProfileId, profileId, branchId, title, description, bandwidth, status, amount } = data;
        const profile = await TicketProfile.findOne({ where: { id: ticketProfileId, profileId, branchId } });

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

    static async addTicketPrice(data: { ticketProfileId: number; profileId: number; branchId: number; amount: number; }) {
        const { ticketProfileId, profileId, branchId, amount } = data;
        const profile = await TicketProfile.findOne({ where: { id: ticketProfileId, profileId, branchId } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        await profile.update({ price: amount });
        return profile;
    }

    static async changeTicketStatus(data: { ticketProfileId: number; profileId: number; branchId: number; status: boolean; }) {
        const { ticketProfileId, profileId, branchId, status } = data;
        const profile = await TicketProfile.findOne({ where: { id: ticketProfileId, profileId, branchId } });
        if (!profile) {
            throw new Error("Profile not found");
        }
        await profile.update({ isActive: status });
        return profile;
    }

    static async fetchTicketProfile(profileId: number, branchId: number) {
        return await TicketProfile.findAll({ where: { profileId, branchId } });
    }

    static async ensureTicketProfileProduct(data: { ticketProfileId: number; profileId: number; branchId: number; branchAmenityId: string }) {
        const { ticketProfileId, profileId, branchId, branchAmenityId } = data;

        const ticketProfile = await TicketProfile.findOne({
            where: { id: ticketProfileId, profileId, branchId },
        });

        if (!ticketProfile) {
            throw new Error("Ticket profile not found");
        }

        const branchAmenity = await BranchAmenity.findOne({
            where: { id: branchAmenityId, branchId, status: Status.ACTIVE },
        });

        if (!branchAmenity) {
            throw new Error("Branch amenity not found");
        }

        const existingProduct = await Product.findOne({
            where: {
                businessId: profileId,
                branchId,
                branchAmenityId,
                name: ticketProfile.title || ticketProfile.name,
            },
        });

        if (existingProduct) {
            return existingProduct;
        }

        const product = await Product.create({
            businessId: profileId,
            branchId,
            branchAmenityId,
            name: ticketProfile.title || ticketProfile.name,
            description: ticketProfile.description || "",
            price: ticketProfile.price || 0,
            status: ProductStatus.AVAILABLE,
            isWifiTicket: true,
            meta: {
                type: "ticket_profile",
                ticketProfileId: ticketProfile.id,
                routerId: ticketProfile.routerId,
                bandwidth: ticketProfile.bandwidth,
                owner: ticketProfile.owner,
            },
        });

        return product;
    }
}
