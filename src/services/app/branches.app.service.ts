import { Op, Transaction, WhereOptions } from "sequelize";
import db from "../../models";
import { normalizeWorkingHours } from "../../utils/working-hours";
import { ICreateBranchPayload, IGetBranchesQuery, IGetBranchesData, IGetBranchesResponse, IBranchDashboardResponse } from "../../interfaces/branches.interface";
import { Branch } from "../../models/Branch";
import { OpeningHour } from "../../models/OpeningHour";
import { Amenity } from "../../models/Amenity";
import { DayOfWeek } from "../../models/types/openingHour.types";
import { BranchAmenity } from "../../models/BranchAmenity";
import { Status } from "../../models/types/amenity.types";
import { BranchStaff } from "../../models/BranchStaff";
import { Product } from "../../models/Product";
import { BranchStaffRole } from "../../models/types/branchStaff.types";
import { IBasicUser } from "../../interfaces/common.interface";
import { AppError } from "../../utils/errors";
import { Post } from "../../models/Post";
import { Transaction as TransactionModel } from "../../models/Transaction";
import { Order } from "../../models/Order";
import { OrderPaymentStatus } from "../../models/types/order.types";
import * as jwtUtil from "../../utils/jwtUtil";
import { sendEmail } from "../email.service";
import { OrderItem } from "../../models/OrderItem";
import { Profile } from "../../models/Profile";
import { User } from "../../models/User";
import { Media } from "../../models/Media";
import { PostTargetType, PostType } from "../../models/types/post.types";
import { ActivityLog } from "../../models/ActivityLog";
import { NetworkRouter } from "../../models/NetworkRouter";
import { TicketProfile } from "../../models/TicketProfile";
import { IGetBranchLogsQuery, IGetBranchMediaQuery, IGetBranchOrdersQuery, IGetBranchReviewsQuery } from "../../interfaces/branches.interface";
import { IGetBranchProductsResponse, IGetProductsQuery } from "../../interfaces/product.interface";
import { ProductService } from "../product.service";
import { MediaTargetTypes } from "../../models/types/media.types";

const { sequelize } = db;

export class AppBranchService {

    static async getBranchById(branchId: number): Promise<Branch | null> {
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
                            postType: PostType.REVIEW,
                            targetType: PostTargetType.BUSINESS,
                        },
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                ],
            });

            if (!branch) return null;

            // 2. Format Response
            return branch
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