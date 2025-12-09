"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const working_hours_1 = require("../utils/working-hours");
const Branch_1 = require("../models/Branch");
const OpeningHour_1 = require("../models/OpeningHour");
const Amenity_1 = require("../models/Amenity");
const BranchAmenity_1 = require("../models/BranchAmenity");
const amenity_types_1 = require("../models/types/amenity.types");
const BranchStaff_1 = require("../models/BranchStaff");
const Product_1 = require("../models/Product");
const branchStaff_types_1 = require("../models/types/branchStaff.types");
const errors_1 = require("../utils/errors");
const { sequelize } = models_1.default;
class BranchService {
    static async createBranch(data, userData) {
        const transaction = await sequelize.transaction();
        try {
            const { name, fullAddress, streetAddress, isHQ, state, country, city, description, working_hours, amenities, staff } = data;
            const { profileId, userId, } = userData;
            // Normalize working hours
            const branchWorkingHours = (0, working_hours_1.normalizeWorkingHours)(working_hours);
            const isExist = await Branch_1.Branch.findOne({
                where: {
                    profileId,
                    name,
                },
                transaction,
            });
            if (isExist) {
                throw new errors_1.AppError("Branch with the same name already exists", 409);
            }
            const branch = await Branch_1.Branch.create({
                profileId,
                name,
                fullAddress,
                description,
                streetAddress,
                state,
                country,
                city,
                isHQ,
                status: amenity_types_1.Status.ACTIVE,
            }, { transaction });
            const branchId = branch.id;
            const workingHourEntries = Object.entries(branchWorkingHours).map(([day, hours]) => ({
                businessId: profileId,
                branchId,
                dayOfWeek: day,
                openTime: hours.open,
                closeTime: hours.close
            }));
            await OpeningHour_1.OpeningHour.bulkCreate(workingHourEntries, { transaction });
            const amenityEntries = amenities.map((amenity) => ({
                businessId: profileId,
                branchId,
                amenityId: amenity,
                status: amenity_types_1.Status.ACTIVE,
                totalRating: 0,
                ratingCount: 0,
            }));
            await BranchAmenity_1.BranchAmenity.bulkCreate(amenityEntries, { transaction });
            if (staff && staff.length > 0) {
                const staffEntries = staff.map(({ fullName, email, role }) => ({
                    businessId: profileId,
                    branchId,
                    fullName,
                    email,
                    role,
                    isActive: true,
                }));
                await BranchStaff_1.BranchStaff.bulkCreate(staffEntries, { transaction });
                // TO-DO:
                //  send email to staff with login info
            }
            // Commit
            await transaction.commit();
            return branch;
        }
        catch (error) {
            await transaction.rollback();
            console.error("Failed to create branch:", error);
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError("Something went wrong while creating branch.", 500);
        }
    }
    static async getBranches(filters, userData) {
        const { cursor, limit = 10, search } = filters;
        const { profileId, userId } = userData;
        const whereClause = {
            profileId
        };
        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            whereClause[sequelize_1.Op.or] = [
                { createdAt: { [sequelize_1.Op.lt]: lastCreatedAt } },
                {
                    createdAt: lastCreatedAt,
                    id: { [sequelize_1.Op.lt]: lastId },
                },
            ];
        }
        if (search) {
            whereClause.name = {
                [sequelize_1.Op.like]: `%${search}%`
            };
        }
        const { count, rows: branches } = await Branch_1.Branch.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: BranchAmenity_1.BranchAmenity,
                    as: "branch_amenities",
                    required: false,
                },
                {
                    model: BranchStaff_1.BranchStaff,
                    as: "staff",
                    required: false,
                },
                {
                    model: OpeningHour_1.OpeningHour,
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
        const formattedBranches = branches.map(branch => {
            const admin = branch.staff?.find(s => s.role === branchStaff_types_1.BranchStaffRole.ADMIN) || null;
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
        let nextCursor = null;
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
    static async getBranchById(branchId, profileId, userId) {
        try {
            return await Branch_1.Branch.findOne({
                where: {
                    id: branchId,
                    profileId,
                },
                include: [
                    {
                        model: BranchAmenity_1.BranchAmenity,
                        as: "branch_amenities",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                        include: [
                            {
                                model: Amenity_1.Amenity,
                                as: "amenity",
                                required: false,
                                attributes: ["id", "name"],
                            }
                        ]
                    },
                    {
                        model: BranchStaff_1.BranchStaff,
                        as: "staff",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: Product_1.Product,
                        as: "products",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                    {
                        model: OpeningHour_1.OpeningHour,
                        as: "openingHours",
                        required: false,
                        attributes: { exclude: ["businessId", "branchId"] },
                    },
                ],
            });
        }
        catch (error) {
            console.error("Failed to fetch branch:", error);
            throw new Error(error.message || "Failed to fetch branch");
        }
    }
    static async deleteBranch(branchId, profileId) {
        try {
            const branch = await Branch_1.Branch.findOne({
                where: {
                    id: branchId,
                    profileId,
                },
            });
            if (!branch) {
                return false;
            }
            // considering other linked data, should soft delete be used instead?
            await branch.destroy();
            return true;
        }
        catch (error) {
            console.error("Failed to delete branch:", error);
            throw new Error(error.message || "Failed to delete branch");
        }
    }
    static async updateBranchStatus(branchId, profileId) {
        try {
            const branch = await Branch_1.Branch.findOne({
                where: {
                    id: branchId,
                    profileId,
                },
            });
            if (!branch) {
                return false;
            }
            await branch.update({ status: branch.status === amenity_types_1.Status.ACTIVE ? amenity_types_1.Status.INACTIVE : amenity_types_1.Status.ACTIVE });
            return true;
        }
        catch (error) {
            console.error("Failed to update branch status:", error);
            throw new Error(error.message || "Failed to update branch status");
        }
    }
}
exports.BranchService = BranchService;
