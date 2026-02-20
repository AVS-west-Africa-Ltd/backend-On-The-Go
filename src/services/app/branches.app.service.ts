import { Op, Transaction, WhereOptions } from "sequelize";
import db from "../../models";
import { normalizeWorkingHours } from "../../utils/working-hours";
import { ICreateBranchPayload, IGetBranchesQuery, IGetBranchesData, IGetBranchesResponse, IBranchDashboardResponse } from "../../interfaces/branches.interface";
import { Branch } from "../../models/branch.model";
import { OpeningHour } from "../../models/openingHour.model";
import { Amenity } from "../../models/amenity.model";
import { DayOfWeek } from "../../models/types/openingHour.types";
import { BranchAmenity } from "../../models/branchAmenity.model";
import { Status } from "../../models/types/amenity.types";
import { BranchStaff } from "../../models/branchStaff.model";
import { Product } from "../../models/product.model";
import { BranchStaffRole } from "../../models/types/branchStaff.types";
import { IBasicUser } from "../../interfaces/common.interface";
import { AppError } from "../../utils/errors";
import { Post } from "../../models/post.model";
import { Transaction as TransactionModel } from "../../models/transaction.model";
import { Order } from "../../models/order.model";
import { OrderPaymentStatus } from "../../models/types/order.types";
import * as jwtUtil from "../../utils/jwtUtil";
import { sendEmail } from "../email.service";
import { OrderItem } from "../../models/orderItem.model";
import { Profile } from "../../models/profile.model";
import { User } from "../../models/user.model";
import { Media } from "../../models/media.model";
import { PostTargetType, PostType } from "../../models/types/post.types";
import { ActivityLog } from "../../models/activityLog.model";
import { MikrotikRouter } from "../../models/mikrotikRouter.model";
import { TicketProfile } from "../../models/ticketProfile.model";
import { IGetBranchLogsQuery, IGetBranchMediaQuery, IGetBranchOrdersQuery, IGetBranchReviewsQuery } from "../../interfaces/branches.interface";
import { IGetBranchProductsResponse, IGetProductsQuery } from "../../interfaces/product.interface";
import { ProductService } from "../product.service";
import { MediaTargetTypes } from "../../models/types/media.types";

const { sequelize } = db;

export class AppBranchService {

    static async getBranchById(branchId: number): Promise<any> {
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
                        model: Profile,
                        as: "profile",
                        required: false,
                        attributes: ["id", "picture", "profileType", "businessCategory"],
                    },
                    {
                        model: OpeningHour,
                        as: "openingHours",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
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
                        },
                        required: false,
                        include: [
                            {
                                model: Profile,
                                as: "author",
                                attributes: ["id", "userName", "picture"]
                            }
                        ],
                        attributes: { exclude: ["businessId", "branchId"] },
                    },

                ],
            });

            if (!branch) return null;

            // 2. Format Response
            const branchData = branch.get({ plain: true });
            const allPosts = (branchData as any).posts || [];

            // Separate reviews and business posts
            (branchData as any).reviews = allPosts.filter((p: any) => p.postType === PostType.REVIEW);
            (branchData as any).businessPosts = allPosts.filter((p: any) =>
                p.postType === PostType.NORMAL && p.profileId === branchData.profileId
            );

            delete (branchData as any).posts;

            return branchData;
        } catch (error: any) {
            console.error("Failed to fetch branch:", error);
            throw new AppError(error.message || "Failed to fetch branch", error.statusCode || 500);
        }
    }

    static async getBranchMedia(branchId: number, filters: IGetBranchMediaQuery) {
        const { cursor, limit = 10, mimeType } = filters;
        const branch = await Branch.findByPk(branchId);
        if (!branch) throw new AppError("Branch not found", 404);

        const where: WhereOptions = { targetId: branchId, targetType: MediaTargetTypes.BUSINESS };

        if (mimeType) where.mimeType = { [Op.like]: `%${mimeType}%` };

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
}