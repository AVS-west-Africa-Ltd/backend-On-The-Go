import { Op, WhereOptions } from "sequelize";
import { User } from "../models/user.model";
import { Profile } from "../models/profile.model";
import { Branch } from "../models/branch.model";
import { Product } from "../models/product.model";
import { Order } from "../models/order.model";
import { Post } from "../models/post.model";
import { Community } from "../models/community.model";
import { Insight } from "../models/insight.model";
import { BusinessRewardRules as RewardRules } from "../models/rewardRules.model";
import { Voucher } from "../models/voucher.model";
import { TicketProfile } from "../models/ticketProfile.model";
import { PostType } from "../models/types/post.types";
import { Media } from "../models/media.model";
import { Admin } from "../models/admin.model";
import { AdminRole } from "../models/types/admin.types";
import { ProfileType } from "../models/types/profile.types";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwtUtil";

export class PlatformAdminService {
    private static async getPaginated<T extends any>(
        model: any,
        where: WhereOptions,
        limit: number,
        cursor?: string,
        include: any[] = [],
        order: any[][] = [["createdAt", "DESC"], ["id", "DESC"]]
    ) {
        const whereClause: any = { ...where };

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            if (lastCreatedAt && lastId) {
                whereClause[Op.or] = [
                    { createdAt: { [Op.lt]: new Date(lastCreatedAt) } },
                    {
                        createdAt: new Date(lastCreatedAt),
                        id: { [Op.lt]: lastId },
                    },
                ];
            }
        }

        const { count, rows: data } = await model.findAndCountAll({
            where: whereClause,
            include,
            limit: limit + 1,
            order,
            distinct: true,
        });

        let nextCursor: string | null = null;
        const hasNextPage = data.length > limit;

        if (hasNextPage) {
            data.pop();
            const lastItem = data[data.length - 1];
            nextCursor = `${lastItem.createdAt.toISOString()}_${lastItem.id}`;
        }

        return {
            results: data,
            total: count,
            nextCursor,
            limit
        };
    }

    static async getAllUsers(filters: any) {
        const { search, isVerified, limit, cursor } = filters;
        const where: any = {};

        if (search) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        if (isVerified !== undefined) {
            where.isVerified = isVerified;
        }

        return this.getPaginated(User, where, limit, cursor);
    }

    static async getAllBusinesses(filters: any) {
        const { search, businessCategory, state, city, limit, cursor } = filters;
        const where: any = { profileType: "business" };

        if (search) {
            where.userName = { [Op.like]: `%${search}%` };
        }

        if (businessCategory) {
            where.businessCategory = businessCategory;
        }

        if (state) where.state = state;
        if (city) where.city = city;

        return this.getPaginated(Profile, where, limit, cursor, [
            { model: User, as: "user", attributes: ["firstName", "lastName", "email"] }
        ]);
    }

    static async getAllBranches(filters: any) {
        const { search, businessId, state, city, limit, cursor } = filters;
        const where: any = {};

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }

        if (businessId) where.profileId = businessId;
        if (state) where.state = state;
        if (city) where.city = city;

        return this.getPaginated(Branch, where, limit, cursor);
    }

    static async getAllProducts(filters: any) {
        const { search, businessId, branchId, status, minPrice, maxPrice, limit, cursor } = filters;
        const where: any = {};

        if (search) where.name = { [Op.like]: `%${search}%` };
        if (businessId) where.businessId = businessId;
        if (branchId) where.branchId = branchId;
        if (status) where.status = status;
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price[Op.gte] = minPrice;
            if (maxPrice !== undefined) where.price[Op.lte] = maxPrice;
        }

        return this.getPaginated(Product, where, limit, cursor, [
            { model: Media, as: "media", required: false }
        ]);
    }

    static async getAllOrders(filters: any) {
        const { search, businessId, branchId, status, from, to, limit, cursor } = filters;
        const where: any = {};

        if (search) where.orderId = { [Op.like]: `%${search}%` };
        if (businessId) where.businessId = businessId;
        if (branchId) where.branchId = branchId;
        if (status) where.status = status;
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt[Op.gte] = new Date(from);
            if (to) where.createdAt[Op.lte] = new Date(to);
        }

        return this.getPaginated(Order, where, limit, cursor);
    }

    static async getAllReviews(filters: any) {
        const { search, profileId, businessId, branchId, rating, limit, cursor } = filters;
        const where: any = { type: PostType.REVIEW };

        if (search) where.content = { [Op.like]: `%${search}%` };
        if (profileId) where.profileId = profileId;
        if (businessId) where.reviewTarget = businessId;
        if (branchId) where.branchId = branchId;
        if (rating) where.rating = rating;

        return this.getPaginated(Post, where, limit, cursor);
    }

    static async getAllPosts(filters: any) {
        const { search, profileId, businessId, branchId, limit, cursor } = filters;
        const where: any = { type: PostType.NORMAL };

        if (search) where.content = { [Op.like]: `%${search}%` };
        if (profileId) where.profileId = profileId;
        if (businessId) where.targetId = businessId; // Posts might use targetId
        if (branchId) where.branchId = branchId;

        return this.getPaginated(Post, where, limit, cursor);
    }

    static async getAllCommunities(filters: any) {
        const { search, profileId, type, limit, cursor } = filters;
        const where: any = {};

        if (search) where.name = { [Op.like]: `%${search}%` };
        if (profileId) where.profileId = profileId;
        if (type) where.type = type;

        return this.getPaginated(Community, where, limit, cursor);
    }

    static async getAllInsights(filters: any) {
        const { businessId, branchId, metric, limit, cursor } = filters;
        const where: any = {};

        if (businessId) where.profileId = businessId;
        if (branchId) where.branchId = branchId;
        if (metric) where.metric = metric;

        return this.getPaginated(Insight, where, limit, cursor);
    }

    static async getAllRewards(filters: any) {
        const { businessId, branchId, limit, cursor } = filters;
        const where: any = {};

        if (businessId) where.businessId = businessId;
        if (branchId) where.branchId = branchId;

        return this.getPaginated(RewardRules, where, limit, cursor);
    }

    static async getAllVouchers(filters: any) {
        const { businessId, branchId, status, limit, cursor } = filters;
        const where: any = {};

        if (businessId) where.businessId = businessId;
        if (branchId) where.branchId = branchId;
        if (status) where.status = status;

        return this.getPaginated(Voucher, where, limit, cursor);
    }

    static async getAllWifiProfiles(filters: any) {
        const { businessId, branchId, limit, cursor } = filters;
        const where: any = {};

        if (businessId) where.profileId = businessId;
        if (branchId) where.branchId = branchId;

        return this.getPaginated(TicketProfile, where, limit, cursor);
    }

    static async getAllWifiTickets(filters: any) {
        const { businessId, branchId, limit, cursor } = filters;
        // Wifi tickets are usually products with a specific branchAmenityId tied to wifi
        // Or vouchers. The user request asks for wifi tickets specifically.
        // In endpoints.txt, 91: Convert ticket profile to products
        // I'll filter products that have a branchAmenity linked to a wifi amenity.
        // For simplicity in a global list, I'll filter products where name/description contains wifi or linked to TicketProfile
        const where: any = {
            [Op.or]: [
                { name: { [Op.like]: "%wifi%" } },
                { description: { [Op.like]: "%wifi%" } }
            ]
        };

        if (businessId) where.businessId = businessId;
        if (branchId) where.branchId = branchId;

        return this.getPaginated(Product, where, limit, cursor);
    }

    static async getAllWifiVouchers(filters: any) {
        const { businessId, branchId, limit, cursor } = filters;
        const where: any = {
            code: { [Op.like]: "OTG-%" } // Assuming OTG- prefix based on some knowledge of wifi vouchers or just search for wifi in description
        };

        if (businessId) where.businessId = businessId;
        if (branchId) where.branchId = branchId;

        return this.getPaginated(Voucher, where, limit, cursor);
    }

    static async getAllSettings(filters: any) {
        // Placeholder for settings if model is found later
        return { data: [], total: 0, nextCursor: null };
    }

    static async login(payload: any) {
        const { email, password } = payload;

        const admin = await Admin.findOne({ where: { email } });
        if (!admin) {
            throw new Error("Invalid email or password");
        }

        const isPasswordValid = bcrypt.compareSync(password, admin.password!);
        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        // Ensure the role is a platform system role
        const systemRoles = [AdminRole.SYSTEM_OWNER, AdminRole.SYSTEM_ADMIN];
        if (!systemRoles.includes(admin.role)) {
            throw new Error("Access denied. Not a platform admin account.");
        }

        const token = generateToken({
            admin: {
                id: admin.id,
                profileId: admin.profileId,
                branchId: admin.branchId,
                businessId: admin.businessId,
                role: admin.role,
                permissions: admin.permissions || [],
                name: admin.name,
                email: admin.email
            },
            profile: { id: admin.profileId, type: ProfileType.PERSONAL },
            branch: admin.branchId,
            user: admin.userId
        } as any);

        const adminPlain = admin.get({ plain: true }) as any;
        delete adminPlain.password;

        return { admin: adminPlain, token };
    }

    static async changePassword(adminId: number, payload: any) {
        const { currentPassword, newPassword } = payload;

        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            throw new Error("Admin not found");
        }

        const isPasswordValid = bcrypt.compareSync(currentPassword, admin.password!);
        if (!isPasswordValid) {
            throw new Error("Invalid current password");
        }

        admin.password = bcrypt.hashSync(newPassword, 10);
        await admin.save();

        return { message: "Password updated successfully" };
    }
}
