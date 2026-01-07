
import db from "../models";
import { Op } from "sequelize";
import { randomCharacters } from "../utils/helpers";
import { Community } from "../models/Community";
import { Member } from "../models/Member";
import { Profile } from "../models/Profile";

const { sequelize } = db;

export class CommunityService {

    static async create(data: any, userId: number, profileId: number, photo: string | null) {
        const transaction = await sequelize.transaction();
        try {
            const { name, description, type, visibility } = data;

            if (!name) {
                throw new Error("Community name is required");
            }

            const community = await Community.create(
                {
                    userId,
                    profileId,
                    name,
                    photo: photo as any,
                    description,
                    type: type || "public",
                    visibility: visibility || "public",
                    inviteCode: randomCharacters(6)
                },
                { transaction }
            );

            await Member.create(
                {
                    profileId: profileId,
                    targetId: community.id,
                    role: "admin",
                    memberType: "community"
                },
                { transaction }
            );

            await transaction.commit();
            return community;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async addMembers(communityId: string, members: number[], profileId: number) {
        const transaction = await sequelize.transaction();
        try {
            if (!communityId || !Array.isArray(members) || members.length === 0) {
                throw new Error("Sorry community ID and members are required");
            }

            const admin = await Member.findOne({
                where: { targetId: communityId, profileId, role: "admin", memberType: "community" },
            });

            if (!admin) {
                throw new Error("Unauthorized. Only admins can add members");
            }

            const entries = members.map((memberId) => ({
                targetId: communityId,
                profileId: memberId,
                memberType: "community",
                role: "member",
            }));

            await Member.bulkCreate(entries as any, {
                transaction,
                ignoreDuplicates: true,
            });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async fetchMembers(query: any) {
        const {
            communityId,
            search = "",
            page = "1",
            limit = "20"
        } = query;

        if (!communityId) {
            throw new Error("CommunityId is required");
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        const searchFilter = search
            ? {
                [Op.or]: [
                    { "$profile.userName$": { [Op.like]: `%${search}%` } },
                    { "$profile.profileType$": { [Op.like]: `%${search}%` } },
                ],
            }
            : {};

        const { rows: members, count } = await Member.findAndCountAll({
            where: {
                targetId: communityId,
                memberType: "community",
                ...searchFilter,
            },
            include: [
                {
                    model: Profile,
                    as: "profile",
                    attributes: ["id", "userName", "profileType", "picture"],
                },
            ],
            limit: limitNum,
            offset,
            order: [["createdAt", "DESC"]],
        });

        return {
            total: count,
            currentPage: pageNum,
            totalPages: Math.ceil(count / limitNum),
            members,
        };
    }

    static async update(communityId: string, data: any, profileId: number, photo: string | null) {
        const transaction = await sequelize.transaction();
        try {
            const community = await Community.findByPk(communityId);

            if (!community) {
                throw new Error("Community not found");
            }

            // Check if user is admin
            const member = await Member.findOne({
                where: { targetId: communityId, profileId, role: "admin", memberType: "community" },
            });

            if (!member) {
                throw new Error("Unauthorized. Only admins can update the community settings.");
            }

            const { name, description, type, visibility } = data;

            if (name) community.name = name;
            if (description !== undefined) community.description = description;
            if (type) community.type = type;
            if (visibility) community.visibility = visibility;
            if (photo) community.photo = photo;

            await community.save({ transaction });
            await transaction.commit();
            return community;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async fetchCommunity(query: any) {
        const { limit = "20", offset = "0", search = "" } = query;

        const whereClause: any = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }

        const { rows: communities, count } = await Community.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Profile,
                    as: "profile",
                    attributes: ["id", "userName", "picture"],
                },
            ],
            limit: Number(limit),
            offset: Number(offset),
            order: [["createdAt", "DESC"]],
        });

        return {
            total: count,
            communities,
            page: Math.floor(Number(offset) / Number(limit)) + 1,
            totalPages: Math.ceil(count / Number(limit)),
        };
    }

    static async fetchCommunityById(communityId: string) {
        const community = await Community.findOne({
            where: { id: communityId },
            include: [
                {
                    model: Profile,
                    as: "profile",
                    attributes: ["id", "userName", "picture"],
                },
            ],
        });

        if (!community) {
            throw new Error("Community not found");
        }

        // Fetch member count
        const memberCount = await Member.count({
            where: { targetId: communityId, memberType: "community" },
        });

        return {
            ...community.toJSON(),
            memberCount,
        };
    }

    static async delete(communityId: string, profileId: number) {
        const transaction = await sequelize.transaction();
        try {
            const community = await Community.findByPk(communityId);

            if (!community) {
                throw new Error("Community not found");
            }

            // ONLY the owner (the person who created it) can delete it
            if (community.profileId !== profileId) {
                throw new Error("Unauthorized. Only the community owner can delete it.");
            }

            // Delete associated members
            await Member.destroy({
                where: { targetId: communityId, memberType: "community" },
                transaction,
            });

            // Delete the community
            await community.destroy({ transaction });

            await transaction.commit();
            return true;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}
