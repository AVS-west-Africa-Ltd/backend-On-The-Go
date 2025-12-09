import { Op, Transaction, WhereOptions } from "sequelize";
import db from "../models";
import { normalizeWorkingHours } from "../utils/working-hours";
import { ICreateBranchPayload, IGetBranchesQuery, IGetBranchesData, IGetBranchesResponse } from "./interfaces/branches.interface";
import { Branch } from "../models/Branch";
import { OpeningHour } from "../models/OpeningHour";
import { Amenity } from "../models/Amenity";
import { DayOfWeek } from "../models/types/openingHour.types";
import { BranchAmenity } from "../models/BranchAmenity";
import { Status } from "../models/types/amenity.types";
import { BranchStaff } from "../models/BranchStaff";
import { Product } from "../models/Product";
import { BranchStaffRole } from "../models/types/branchStaff.types";
import { IBasicUser } from "./interfaces/common.interface";
import { AppError } from "../utils/errors";
import { Post } from "../models/Post";
import { Transaction as TransactionModel } from "../models/Transaction";

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
                    name,
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
                const staffEntries = staff.map(({ fullName, email, role }) => ({
                    businessId: profileId,
                    branchId,
                    fullName,
                    email,
                    role,
                    isActive: true,
                }));

                await BranchStaff.bulkCreate(staffEntries, { transaction });

                // TO-DO:
                //  send email to staff with login info
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

    static async getBranches(filters: IGetBranchesQuery, userData: IBasicUser): Promise<IGetBranchesResponse> {
        const { cursor, limit = 10, search } = filters;
        const { profileId, userId } = userData;

        const whereClause: WhereOptions = {
            profileId
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
                admin: admin ? { fullname: admin.fullName, email: admin.email } : null,
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

    static async getBranchById(branchId: number, profileId: number, userId: number) {
        try {
            return await Branch.findOne({
                where: {
                    id: branchId,
                    profileId,
                },
                include: [
                    {
                        model: BranchAmenity,
                        as: "branch_amenities",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
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
                        model: BranchStaff,
                        as: "staff",
                        required: false,
                        
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: Product,
                        as: "products",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: OpeningHour,
                        as: "openingHours",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                ],
            });
        } catch (error: any) {
            console.error("Failed to fetch branch:", error);
            throw new Error(error.message || "Failed to fetch branch");
        }
    }

    static async deleteBranch(branchId: number, profileId: number): Promise<boolean> {
        try {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                    profileId,
                },
            });

            if (!branch) {
                return false;
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

    static async updateBranchStatus(branchId: number, profileId: number): Promise<boolean> {
        try {
            const branch = await Branch.findOne({
                where: {
                    id: branchId,
                    profileId,
                },
            });

            if (!branch) {
                return false;
            }

            await branch.update({ status: branch.status === Status.ACTIVE ? Status.INACTIVE : Status.ACTIVE });
            return true;
        } catch (error: any) {
            console.error("Failed to update branch status:", error);
            throw new Error(error.message || "Failed to update branch status");
        }
    }
}