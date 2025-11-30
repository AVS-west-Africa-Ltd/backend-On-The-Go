const { sequelize, Community, Member, Profile } = require("../models");
const Helpers = require("../utils/helpers");
exports.create = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { name, description, type, visibility } = req.body;
        const userId = req.user;
        const profileId = req.profile.id;
        if (!name) {
            await transaction.rollback();
            return res.status(400).json({ message: "Community name is required" });
        }
        const community = await Community.create({
            userId,
            profileId,
            name,
            photo: req.file?.location || null,
            description,
            type: type || "public",
            visibility: visibility || "public",
            inviteCode: Helpers.randomCharacters(6)
        }, { transaction });
        await Member.create({
            profileId: profileId,
            targetId: community.id,
            role: "admin",
            memberType: "community"
        }, { transaction });
        await transaction.commit();
        return res.status(201).json({
            message: "Community created successfully!",
            community,
        });
    }
    catch (error) {
        await transaction.rollback();
        console.error("Create community error:", error);
        return res.status(500).json({ message: "Failed to create community" });
    }
};
exports.addMembers = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { communityId, members = [] } = req.body;
        const profileId = req.profile.id;
        if (!communityId || !Array.isArray(members) || members.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Sorry community ID and members are required" });
        }
        const admin = await Member.findOne({
            where: { targetId: communityId, profileId, role: "admin", memberType: "community" },
        });
        if (!admin) {
            await transaction.rollback();
            return res.status(403).json({ message: "Sorry you are not an admin of this community" });
        }
        const entries = members.map((memberId) => ({
            targetId: communityId,
            profileId: memberId,
            memberType: "community",
            role: "member",
        }));
        await Member.bulkCreate(entries, {
            transaction,
            ignoreDuplicates: true,
        });
        await transaction.commit();
        return res.status(200).json({ message: "Members added successfully!" });
    }
    catch (error) {
        await transaction.rollback();
        console.error("Add members error:", error);
        return res.status(500).json({ message: "Sorry, failed to add members" });
    }
};
exports.fetchMembers = async (req, res) => {
    try {
        const { communityId, search = "", page = 1, limit = 20 } = req.query;
        if (!communityId) {
            return res.status(400).json({ message: "Sorry, communityId is required" });
        }
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const searchFilter = search
            ? {
                [Op.or]: [
                    { "$profile.userName$": { [Op.iLike]: `%${search}%` } },
                    { "$profile.profileType$": { [Op.iLike]: `%${search}%` } },
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
            limit: parseInt(limit, 10),
            offset,
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json({
            total: count,
            currentPage: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            members,
        });
    }
    catch (error) {
        console.error("❌ Fetch members error:", error);
        return res.status(500).json({
            message: "Sorry, failed to fetch members",
        });
    }
};
