import { Op, Transaction, WhereOptions, fn, col, literal } from "sequelize";
import db from "../models";
import bcrypt from "bcryptjs";
import { normalizeWorkingHours } from "../utils/working-hours";
import { ICreateBranchPayload, IGetBranchesQuery, IGetBranchesData, IGetBranchesResponse, IBranchDashboardResponse } from "../interfaces/branches.interface";
import { Branch } from "../models/Branch";
import { OpeningHour } from "../models/OpeningHour";
import { Amenity } from "../models/Amenity";
import { DayOfWeek } from "../models/types/openingHour.types";
import { BranchAmenity } from "../models/BranchAmenity";
import { Status } from "../models/types/amenity.types";
import { BranchStaff } from "../models/BranchStaff";
import { Product } from "../models/Product";
import { BranchStaffRole } from "../models/types/branchStaff.types";
import { IBasicUser } from "../interfaces/common.interface";
import { AppError } from "../utils/errors";
import { Post } from "../models/Post";
import { Transaction as TransactionModel } from "../models/Transaction";
import { Order } from "../models/Order";
import { OrderPaymentStatus } from "../models/types/order.types";
import * as jwtUtil from "../utils/jwtUtil";
import { sendEmail } from "../services/email.service";
import { OrderItem } from "../models/OrderItem";
import { Profile } from "../models/Profile";
import { User } from "../models/User";
import { Media } from "../models/Media";
import { PostTargetType, PostType, ReviewSortType } from "../models/types/post.types";
import { ActivityLog } from "../models/ActivityLog";
import { NetworkRouter } from "../models/NetworkRouter";
import { TicketProfile } from "../models/TicketProfile";
import { IGetBranchLogsQuery, IGetBranchMediaQuery, IGetBranchOrdersQuery, IGetBranchReviewsQuery } from "../interfaces/branches.interface";
import { appEvents } from "../utils/events";
import { STAFF_EVENT } from "../subscribers/types";
import { IGetBranchProductsResponse, IGetProductsQuery } from "../interfaces/product.interface";
import { ProductService } from "./product.service";
import { AdminPermission, AdminRole } from "../models/types/admin.types";
import { Admin } from "../models/Admin";
import { randomCharacters, randomNumber } from "../utils/helpers";

const { sequelize } = db;

export class BranchService {

    static async createBranch(data: ICreateBranchPayload, userData: IBasicUser) {
        const transaction: Transaction = await sequelize.transaction();

        try {
            const { name, fullAddress, streetAddress, isHQ, state, country, city, description, working_hours, amenities, staff } = data;
            const { profileId, userId, } = userData;

            // Normalize working hours
            const branchWorkingHours = normalizeWorkingHours(working_hours);

            const isExist = await Branch.findOne({
                where: {
                    profileId,
                    name,
                },
                transaction,
            });

            if (isExist) {
                throw new AppError("Branch with the same name already exists", 409);
            }

            const branch = await Branch.create(
                {
                    profileId,
                    name: `${name} ${isHQ ? "(HQ)" : ""} ${city} ${state}`,
                    fullAddress,
                    description,
                    streetAddress,
                    state,
                    country,
                    city,
                    isHQ,
                    status: Status.ACTIVE,
                },
                { transaction }
            );

            const branchId = branch.id;

            const workingHourEntries = Object.entries(branchWorkingHours).map(
                ([day, hours]: [string, any]) => ({
                    businessId: profileId,
                    branchId,
                    dayOfWeek: day as DayOfWeek,
                    openTime: hours.open,
                    closeTime: hours.close
                })
            );

            await OpeningHour.bulkCreate(workingHourEntries, { transaction });

            const amenityEntries = amenities.map((amenity: string) => ({
                businessId: profileId,
                branchId,
                amenityId: amenity,
                status: Status.ACTIVE,
                totalRating: 0,
                ratingCount: 0,
            }));

            await BranchAmenity.bulkCreate(amenityEntries, { transaction });

            if (staff && staff.length > 0) {
                const staffEntries = staff.map(({ firstName, lastName, email, role }) => ({
                    businessId: profileId,
                    branchId,
                    firstName,
                    lastName,
                    email,
                    role,
                    isActive: false,
                }));

                const createdStaff = await BranchStaff.bulkCreate(staffEntries, { transaction });


                // Commit transaction first
                await transaction.commit();

                // Emit events for background email sending (after commit)
                for (let i = 0; i < createdStaff.length; i++) {

                    // Temporary auto-acceptance for development
                    if (process.env.NODE_ENV === 'development') {
                        appEvents.emit(STAFF_EVENT.STAFF_AUTO_ACCEPT, {
                            firstName: createdStaff[i].firstName,
                            lastName: createdStaff[i].lastName,
                            email: createdStaff[i].email,
                            branchId: branchId,
                            branchStaffId: createdStaff[i].id,
                        });
                    }

                    const staffMember = createdStaff[i];
                    const inviteToken = jwtUtil.generateToken({
                        user: -1,
                        profile: null,
                        branch: branchId,
                        branchName: branch.name,
                        invite: {
                            id: staffMember.id,
                            email: staffMember.email,
                            role: staffMember.role
                        }
                    } as any);

                    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/complete-invite?token=${inviteToken}`;

                    // Emit event for background processing
                    appEvents.emit(STAFF_EVENT.STAFF_INVITED, {
                        firstName: staffMember.firstName,
                        lastName: staffMember.lastName,
                        email: staffMember.email,
                        branchName: branch.name,
                        role: staffMember.role,
                        inviteLink
                    });
                }

                return branch;
            }


            // Commit
            await transaction.commit();
            return branch;

        } catch (error: any) {
            await transaction.rollback();
            console.error("Failed to create branch:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Something went wrong while creating branch.", 500);
        }
    }

    static async checkAccess(branch: Branch, profileId: number, userId: number): Promise<boolean> {
        // 1. Business Owner check
        if (branch.profileId === profileId) {
            return true;
        }

        // 2. Staff Admin check
        const staff = await BranchStaff.findOne({
            where: {
                branchId: branch.id,
                userId: userId,
                role: BranchStaffRole.ADMIN,
                isActive: true
            }
        });

        return !!staff;
    }

    static async getBranches(filters: IGetBranchesQuery, userData: IBasicUser): Promise<IGetBranchesResponse> {
        const { cursor, limit = 10, search } = filters;
        const { profileId, userId } = userData;

        // For listing, we show branches owned by the profile OR where the user is staff
        const staffBranches = await BranchStaff.findAll({
            where: { userId, isActive: true },
            attributes: ["branchId"]
        });
        const staffBranchIds = staffBranches.map(s => s.branchId);

        const whereClause: any = {
            [Op.or]: [
                { profileId },
                { id: { [Op.in]: staffBranchIds } }
            ]
        };

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");


            (whereClause as any)[Op.or] = [
                { createdAt: { [Op.lt]: lastCreatedAt } },
                {
                    createdAt: lastCreatedAt,
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        if (search) {
            whereClause.name = {
                [Op.like]: `%${search}%`
            };
        }

        const { count, rows: branches } = await Branch.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: BranchAmenity,
                    as: "branch_amenities",
                    required: false,
                },
                {
                    model: BranchStaff,
                    as: "staff",
                    required: false,
                },
                {
                    model: OpeningHour,
                    as: "openingHours",
                    required: false,
                },
            ],
            order: [
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
            limit: limit + 1,
            distinct: true,
        });

        const formattedBranches: IGetBranchesData[] = branches.map(branch => {
            const admin = branch.staff?.find(s => s.role === BranchStaffRole.ADMIN) || null;

            return {
                id: branch.id,
                name: branch.name,
                admin: admin ? { firstname: admin.firstName, lastname: admin.lastName, email: admin.email } : null,
                state: branch.state || "",
                city: branch.city || "",
                created_at: branch.createdAt,
                isHQ: branch.isHQ,
                status: branch.status,
            };
        });

        let nextCursor: string | null = null;
        const hasNextPage = branches.length > limit;

        if (hasNextPage) {
            branches.pop();
            const lastBranch = branches[branches.length - 1];
            if (lastBranch && lastBranch.createdAt) {
                nextCursor = `${lastBranch.createdAt.toISOString()}_${lastBranch.id}`;
            }
        }

        return {
            branches: formattedBranches,
            total: count,
            nextCursor,
        };


    }

    static async getBranchById(branchId: number, profileId: number, userId: number): Promise<IBranchDashboardResponse | null> {
        try {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                },
                include: [
                    {
                        model: BranchAmenity,
                        as: "branch_amenities",
                        required: false,
                        include: [
                            {
                                model: Amenity,
                                as: "amenity",
                                required: false,
                                attributes: ["id", "name"],
                            }
                        ]
                    },
                    {
                        model: OpeningHour,
                        as: "openingHours",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: Product,
                        as: "products",
                        required: false,
                        include: [
                            {
                                model: BranchAmenity,
                                as: "branch_amenity",
                                include: [{ model: Amenity, as: "amenity" }]
                            }
                        ]
                    },
                    {
                        model: Media,
                        as: "media",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: Post,
                        as: "posts",
                        where: {
                            branchId,
                            profileId,
                            postType: PostType.REVIEW,
                            targetType: PostTargetType.BUSINESS,
                        },
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: BranchStaff,
                        as: "staff",
                        required: false,
                        attributes: ["id", "fullName", "email", "role"],
                    },
                    {
                        model: Order,
                        as: "orders",
                        required: false,
                        include: [
                            {
                                model: Profile,
                                as: "customer",
                                required: true,
                                attributes: ["id", "picture",],
                                include: [
                                    {
                                        model: User,
                                        as: "user",
                                        required: true,
                                        attributes: ["id", "firstName", "lastName"],
                                    }
                                ]
                            }
                        ]
                    },
                ],
            });

            if (!branch) return null;


            const hasAccess = await this.checkAccess(branch, profileId, userId);
            if (!hasAccess) {
                throw new AppError("You don't have access to this branch", 403);
            }

            // 1. Calculate Stats
            const paidOrders: Order[] = (branch.orders || []).filter((o: Order) => o.paymentStatus === OrderPaymentStatus.PAID);
            const totalRevenue = paidOrders.reduce((sum: number, o: Order) => sum + o.totalAmount, 0);
            const activeCustomers = new Set((branch.orders || []).map((o: Order) => o.customerId)).size;

            // 2. Format Response
            return {
                branchInfo: {
                    id: branch.id,
                    name: branch.name,
                    description: branch.description || null,
                    fullAddress: branch.fullAddress || "",
                    state: branch.state || "",
                    city: branch.city || "",
                    rating: branch.rating || 0,
                    followers: branch.followers || 0,
                    status: branch.status,
                    registrationDate: branch.createdAt,
                    lastLogin: null, // Placeholder
                },
                stats: {
                    totalRevenue,
                    activeCustomers,
                    activeWifiSessions: 0, // Placeholder
                    revenueGrowth: 0, // Placeholder
                    customerGrowth: 0, // Placeholder
                    wifiGrowth: 0, // Placeholder
                },
                chartData: {
                    revenue: [], // Placeholder
                    wifi: [], // Placeholder
                },
                tabs: {
                    orders: (branch.orders || []).slice(0, 10),
                    wifiInfrastructure: null, // Placeholder
                    productsAndAmenities: (branch.products || []).map(p => ({
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        category: p.branch_amenity?.amenity?.name || "Uncategorized",
                        status: p.status,
                        createdAt: p.createdAt
                    })).slice(0, 10),
                    adminAndStaff: (branch.staff || []),
                    activityLog: [], // Placeholder
                    picturesAndVideos: (branch.media || []).map(m => ({
                        id: m.id,
                        url: m.filePath,
                        type: m.mimeType,
                        createdAt: m.createdAt
                    })).slice(0, 10),
                    reviews: branch.posts || [],
                }
            };
        } catch (error: any) {
            console.error("Failed to fetch branch:", error);
            throw new AppError(error.message || "Failed to fetch branch", error.statusCode || 500);
        }
    }

    static async deleteBranch(branchId: number, profileId: number, userId: number): Promise<boolean> {
        try {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                },
            });

            if (!branch) {
                return false;
            }

            const hasAccess = await this.checkAccess(branch, profileId, userId);
            if (!hasAccess) {
                throw new AppError("You don't have access to delete this branch", 403);
            }

            const branchPosts = await Post.findAll({
                where: {
                    branchId,
                    profileId,
                }
            })

            if (branchPosts && branchPosts.length !== 0) {
                throw new AppError("Cannot delete branch with linked posts", 400);
            }

            const branchTransactions = await TransactionModel.findAll({
                where: {
                    branchId,
                    businessId: profileId,
                }
            })

            if (branchTransactions && branchTransactions.length !== 0) {
                throw new AppError("Cannot delete branch with linked transactions", 400);
            }

            // considering other linked data, should soft delete be used instead?
            // TO-DO: Check if there is a linked post or transaction before deleting
            await branch.destroy();
            return true;
        } catch (error: any) {
            console.error("Failed to delete branch:", error);
            throw new Error(error.message || "Failed to delete branch");
        }
    }

    static async updateBranchStatus(branchId: number, profileId: number, userId: number): Promise<boolean> {
        try {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                },
            });

            if (!branch) {
                return false;
            }

            const hasAccess = await this.checkAccess(branch, profileId, userId);
            if (!hasAccess) {
                throw new AppError("You don't have access to update this branch status", 403);
            }

            await branch.update({ status: branch.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE });
            return true;
        } catch (error: any) {
            console.error("Failed to update branch status:", error);
            throw new Error(error.message || "Failed to update branch status");
        }
    }
    static async inviteStaff(branchId: number, data: { firstName: string, lastName: string, email: string, role: BranchStaffRole }, userData: IBasicUser) {
        const { profileId, userId } = userData;

        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Unauthorized to invite staff to this branch", 403);

        const existingStaff = await BranchStaff.findOne({ where: { email: data.email, branchId } });
        if (existingStaff) throw new AppError("Staff already invited to this branch", 400);

        const staffEntry = await BranchStaff.create({
            businessId: branch.profileId,
            branchId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            isActive: false,
        });

        // Generate Invite Token (using jwtUtil)
        const inviteToken = jwtUtil.generateToken({
            user: -1, // placeholder
            profile: null,
            branch: branchId,
            invite: {
                id: staffEntry.id,
                email: data.email,
                role: data.role
            }
        } as any);

        // Generate invite link
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/complete-invite?token=${inviteToken}`;

        // Emit event for background email sending
        appEvents.emit(STAFF_EVENT.STAFF_INVITED, {
            // fullName: data.fullName,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            branchName: branch.name,
            role: data.role,
            inviteLink
        });

        // Temporary auto-acceptance for development
        if (process.env.NODE_ENV === 'development') {
            appEvents.emit(STAFF_EVENT.STAFF_AUTO_ACCEPT, {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                branchId: branchId,
                branchStaffId: staffEntry.id,
            });
        }

        return { message: "Invitation sent successfully", staff: staffEntry };
    }

    static async getBranchOrders(branchId: number, profileId: number, userId: number, filters: IGetBranchOrdersQuery) {
        const { cursor, limit = 10, status, startDate, endDate } = filters;
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Branch not found", 404);

        const where: any = { branchId };
        if (status) where.paymentStatus = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            where[Op.or] = [
                { createdAt: { [Op.lt]: new Date(lastCreatedAt) } },
                {
                    createdAt: new Date(lastCreatedAt),
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const { count, rows: orders } = await Order.findAndCountAll({
            where,
            include: [
                { model: OrderItem, as: "items" },
                {
                    model: Profile,
                    as: "customer",
                    attributes: ["id", "userName", "picture"],
                },
            ],
            order: [
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
            limit: limit + 1,
            distinct: true,
        });

        let nextCursor: string | null = null;
        const hasNextPage = orders.length > limit;
        if (hasNextPage) {
            orders.pop();
            const last = orders[orders.length - 1];
            nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
        }

        return { orders, total: count, nextCursor };
    }
    static async getBranchStaff(branchId: number, profileId: number, userId: number, filters: IGetBranchOrdersQuery) {
        const { cursor, limit = 10, status, startDate, endDate } = filters;
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Branch not found", 404);

        const where: any = { branchId };
        if (status) where.paymentStatus = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            where[Op.or] = [
                { createdAt: { [Op.lt]: new Date(lastCreatedAt) } },
                {
                    createdAt: new Date(lastCreatedAt),
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const { count, rows: staff } = await BranchStaff.findAndCountAll({
            where,
            include: [
                {
                    model: Profile,
                    as: "business",
                    attributes: ["id", "userName", "picture"]
                },
                {
                    model: User,
                    as: "account",
                    attributes: ["id", "firstName", "lastName", "email"],
                    include: [
                        {
                            model: Profile,
                            as: "profiles",
                            attributes: ["id", "userName", "picture", "profileType"],
                            // Optionally limit to just one profile if staff only have one
                            limit: 1
                        }
                    ]
                },
            ],
            order: [
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
            limit: limit + 1,
            distinct: true,
        });

        let nextCursor: string | null = null;
        const hasNextPage = staff.length > limit;
        if (hasNextPage) {
            staff.pop();
            const last = staff[staff.length - 1];
            nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
        }

        return { staff, total: count, nextCursor };
    }

    static async getBranchWifi(branchId: number, profileId: number, userId: number) {
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Branch not found", 403);

        const router = await NetworkRouter.findOne({
            where: { branchId },
            include: [{ model: TicketProfile, as: 'ticketProfiles' }]
        });

        // Fallback to business owner's router if no branch-specific router exists yet
        if (!router) {
            return await NetworkRouter.findOne({
                where: { userId: branch.profileId }, // assuming owner's userId matches profileId link somehow, or just return null
                include: [{ model: TicketProfile, as: 'ticketProfiles' }]
            });
        }

        return router;
    }

    static async getBranchProducts(branchId: number, profileId: number, userId: number, filters: IGetProductsQuery): Promise<IGetBranchProductsResponse> {
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Branch not found", 403);

        // Reuse ProductService but ensured with access first
        return await ProductService.getBranchProducts(filters, { profileId, userId, branchId });
    }

    static async getBranchLogs(branchId: number, profileId: number, userId: number, filters: IGetBranchLogsQuery) {
        const { cursor, limit = 10, action, userId: filterUserId } = filters;
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Branch not found", 403);

        const where: any = { branchId };
        if (action) where.action = action;
        if (filterUserId) where.userId = filterUserId;

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            where[Op.or] = [
                { createdAt: { [Op.lt]: new Date(lastCreatedAt) } },
                {
                    createdAt: new Date(lastCreatedAt),
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const { count, rows: logs } = await ActivityLog.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            limit: limit + 1
        });

        let nextCursor: string | null = null;
        if (logs.length > limit) {
            logs.pop();
            const last = logs[logs.length - 1];
            nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
        }

        return { logs, total: count, nextCursor };
    }

    static async getBranchMedia(branchId: number, profileId: number, userId: number, filters: IGetBranchMediaQuery) {
        const { cursor, limit = 10, mimeType } = filters;
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const hasAccess = await this.checkAccess(branch, profileId, userId);
        if (!hasAccess) throw new AppError("Branch not found", 404);

        const where: any = { targetId: branchId, targetType: 'business' };
        if (mimeType) where.mimeType = { [Op.like]: `%${mimeType}%` };

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            where[Op.or] = [
                { createdAt: { [Op.lt]: new Date(lastCreatedAt) } },
                {
                    createdAt: new Date(lastCreatedAt),
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const { count, rows: media } = await Media.findAndCountAll({
            where,
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            limit: limit + 1
        });

        let nextCursor: string | null = null;
        if (media.length > limit) {
            media.pop();
            const last = media[media.length - 1];
            nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
        }

        return { media, total: count, nextCursor };
    }

    static async getBranchReviews(branchId: number, profileId: number, userId: number, filters: IGetBranchReviewsQuery) {
        const { cursor, rating, sortBy = ReviewSortType.MOST_RECENT } = filters;
        const limit = parseInt(filters.limit as any, 10) || 10;
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const where: WhereOptions = { targetId: branchId, postType: PostType.REVIEW };
        if (rating) {
            (where as any)[Op.and] = [
                literal(`rating->>'$.overall' = ${parseInt(rating as any, 10)}`)
            ];
        }


        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            (where as any)[Op.or] = [
                { createdAt: { [Op.lt]: new Date(lastCreatedAt) } },
                {
                    createdAt: new Date(lastCreatedAt),
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        // Define sorting
        let order: any[] = [['createdAt', 'DESC'], ['id', 'DESC']];
        if (sortBy === ReviewSortType.HIGHEST_RATING) {
            order = [[literal("rating->>'$.overall'"), 'DESC'], ['createdAt', 'DESC']];
        } else if (sortBy === ReviewSortType.LOWEST_RATING) {
            order = [[literal("rating->>'$.overall'"), 'ASC'], ['createdAt', 'DESC']];
        } else if (sortBy === ReviewSortType.MOST_RELEVANT) {
            // Sort by author's total review count using a subquery in order
            order = [
                [
                    literal(`(
                        SELECT COUNT(*)
                        FROM posts AS p
                        WHERE p.profileId = Post.profileId
                        AND p.postType = 'review'
                    )`),
                    'DESC'
                ],
                ['createdAt', 'DESC']
            ];
        }

        const { count, rows: reviews } = await Post.findAndCountAll({
            where,
            include: [
                {
                    model: Profile,
                    as: 'author',
                    attributes: [
                        'id', 'userName', 'picture',
                        [
                            literal(`(
                                SELECT COUNT(*)
                                FROM posts AS p
                                WHERE p.profileId = author.id
                                AND p.postType = 'review'
                            )`),
                            'totalReviews'
                        ]
                    ]
                }
            ],
            order,
            limit: limit + 1,
            distinct: true
        });

        // Calculate rating distribution
        const stats = await Post.findAll({
            where: { targetId: branchId, postType: PostType.REVIEW },
            attributes: [
                [literal("rating->>'$.overall'") as any, 'score'],
                [fn('COUNT', col('id')), 'count']
            ],
            group: [literal("rating->>'$.overall'") as any],
            raw: true
        }) as any[];

        const ratingDistribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
        stats.forEach(s => {
            if (s.score && ratingDistribution[s.score] !== undefined) {
                ratingDistribution[s.score] = parseInt(s.count, 10);
            }
        });

        let nextCursor: string | null = null;
        if (reviews.length > limit) {
            reviews.pop();
            const last = reviews[reviews.length - 1];
            nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
        }

        return {
            reviews,
            total: count,
            nextCursor,
            ratingDistribution,
            branchStats: {
                rating: branch.rating,
                reviewCount: branch.reviewCount
            }
        };
    }
}