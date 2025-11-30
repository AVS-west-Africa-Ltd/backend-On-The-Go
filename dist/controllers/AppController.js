const { Post, Profile, sequelize, Amenity, Comment, User, Reaction, Friend, Chat, Member, Community, Branch } = require("../models");
const { Op, fn, col, where } = require("sequelize");
exports.createPost = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { body, postType = "normal", target = null, amenities = null, } = req.body;
        const userId = req.user;
        const profileId = req.profile.id;
        const branchId = req.branch || null;
        let media = [];
        if (req.files && Array.isArray(req.files)) {
            media = req.files.map((file) => file.location || file.path);
        }
        let parsedAmenities = {};
        let finalBranchId = null;
        let finalReviewTarget = null;
        let finalRating = {};
        switch (postType) {
            case "normal":
                finalBranchId = branchId;
                break;
            case "review":
                const branch = await Branch.findOne({
                    where: { id: target },
                    transaction: t,
                });
                if (!branch) {
                    await t.rollback();
                    return res.status(400).json({
                        message: "Sorry, only a business profile can be reviewed.",
                    });
                }
                parsedAmenities =
                    typeof amenities === "object" && !Array.isArray(amenities)
                        ? amenities
                        : JSON.parse(amenities || "{}");
                for (const key of Object.keys(parsedAmenities)) {
                    const ratingValue = parsedAmenities[key];
                    await Amenity.increment({ rating: ratingValue }, {
                        where: { branchId: target, businessId: branch.profileId, name: key },
                        transaction: t,
                    });
                }
                finalReviewTarget = target;
                finalRating = parsedAmenities;
                break;
            default:
                await t.rollback();
                return res.status(400).json({
                    message: `Invalid post type: ${postType}`,
                });
        }
        const post = await Post.create({
            userId,
            profileId,
            branchId: finalBranchId,
            body,
            postType,
            reviewTarget: finalReviewTarget,
            media,
            rating: finalRating,
        }, { transaction: t });
        await t.commit();
        return res.status(201).json({ post, message: "Post created successfully!" });
    }
    catch (error) {
        await t.rollback();
        console.error("Error creating post:", error);
        return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};
exports.fetchPosts = async (req, res) => {
    try {
        const { offset = 0, search = "", type = null } = req.query;
        const whereClause = {};
        if (search) {
            whereClause[Op.or] = [{ body: { [Op.like]: `%${search}%` } }];
        }
        let includeArray = [];
        switch (type) {
            case "normal":
                whereClause.postType = "normal";
                includeArray = [
                    {
                        model: Branch,
                        as: "branch",
                        required: false,
                        include: [
                            {
                                model: Profile,
                                as: "profile",
                                required: false,
                                attributes: ["id", "userName", "profileType", "avatar"],
                            },
                        ],
                    },
                ];
                break;
            case "review":
                whereClause.postType = "review";
                includeArray = [
                    {
                        model: Profile,
                        as: "business",
                        required: false,
                        attributes: ["id", "userName", "profileType", "avatar"],
                    },
                    {
                        model: Profile,
                        as: "author",
                        required: false,
                        attributes: ["id", "userName", "profileType", "avatar"],
                    },
                ];
                break;
            default:
                return res.status(400).json({
                    message: "Invalid type. Allowed types: 'normal' or 'review'.",
                });
        }
        const posts = await Post.findAll({
            where: whereClause,
            include: includeArray,
            limit: 20,
            offset: parseInt(offset, 10),
            order: [["createdAt", "DESC"]],
        });
        return res.status(200).json({
            posts,
            message: "Posts fetched successfully",
        });
    }
    catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(400).json({ message: "Failed to fetch posts" });
    }
};
exports.searchBusinesses = async (req, res) => {
    try {
        const { search = "", offset = 0, location = "", amenity = "", businessType } = req.query;
        const query = {};
        const radius = 10000; // in meters
        if (search && search.trim() !== "") {
            query.name = { [Op.like]: `%${search.trim()}%` }; // search by branch name
        }
        if (location && location.includes(",")) {
            const [lat, lng] = location.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                query[Op.and] = where(fn("ST_Distance_Sphere", col("geoLocation"), fn("ST_GeomFromText", `POINT(${lng} ${lat})`)), { [Op.lte]: radius });
            }
        }
        const branches = await Branch.findAll({
            where: query,
            include: [
                {
                    model: Profile,
                    as: "profile", // the profile the branch belongs to
                    required: true,
                    where: {
                        profileType: { [Op.eq]: type.trim() },
                        ...(businessType && { businessType: { [Op.like]: `%${businessType.trim()}%` } }),
                    },
                    attributes: ["id", "userName", "profileType", "avatar", "businessType"],
                },
                {
                    model: Amenity,
                    as: "amenities",
                    required: amenity && amenity.trim() !== "" ? true : false,
                    where: amenity && amenity.trim() !== ""
                        ? { name: { [Op.eq]: amenity.trim() } }
                        : undefined,
                },
            ],
            limit: 20,
            offset: Number(offset) || 0,
            order: [["createdAt", "DESC"]],
        });
        res.status(200).json({
            branches,
            message: "Branches with profiles fetched successfully",
        });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({
            message: "Sorry something went wrong while searching profiles",
        });
    }
};
exports.viewBusiness = async (req, res) => {
    try {
        const { branchId } = req.params;
        const branch = await Branch.findOne({
            where: { id: branchId },
            include: [
                {
                    model: Profile,
                    as: "profile",
                    include: [
                        {
                            model: Media,
                            as: "media"
                        }, {
                            model: Post,
                            as: "reviews",
                            where: {
                                postType: "review"
                            },
                            required: false,
                            include: [
                                {
                                    model: Profile,
                                    as: "author"
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Amenity,
                    as: "amenities",
                },
            ],
        });
        if (!branch) {
            return res.status(404).json({ message: "Sorry business not found" });
        }
        return res.status(200).json({
            branch,
            message: "Business fetched successfully!",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            message: "Something went wrong while fetching business details",
        });
    }
};
exports.makeComment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { postId, body, parentId = null } = req.body;
        const comment = await Comment.create({
            postId,
            body,
            userId: req.user,
            profileId: req.profile.id,
            parentId
        });
        await Post.increment({ comments: 1 }, { where: { id: postId }, transaction: t });
        await t.commit();
        return res.status(201).json({ comment, message: "Comment created successfully" });
    }
    catch (error) {
        await t.rollback();
        console.error("Create comment error:", error);
        res.status(500).json({ message: "Sorry failed to create comment" });
    }
};
exports.toggleReaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { targetId, targetType, type } = req.body;
        const validTargets = { comment: Comment, post: Post };
        const validReactions = ['like', 'dislike', 'love'];
        if (!targetId || !targetType || !type) {
            await t.rollback();
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (!validTargets[targetType]) {
            await t.rollback();
            return res.status(400).json({ message: "Invalid target type" });
        }
        if (!validReactions.includes(type)) {
            await t.rollback();
            return res.status(400).json({ message: "Invalid reaction type" });
        }
        const existingReaction = await Reaction.findOne({
            where: {
                userId: req.user,
                targetId,
                targetType,
            },
            transaction: t,
        });
        if (existingReaction) {
            await existingReaction.destroy({ transaction: t });
            await validTargets[targetType].decrement({ likes: 1 }, { where: { id: targetId }, transaction: t });
            await t.commit();
            return res.status(200).json({
                message: "Reaction removed successfully"
            });
        }
        await validTargets[targetType].increment({ likes: 1 }, { where: { id: targetId }, transaction: t });
        const reaction = await Reaction.create({
            userId: req.user,
            profileId: req.profile.id,
            type,
            targetId,
            targetType,
        }, { transaction: t });
        await t.commit();
        return res.status(200).json({
            message: "Reaction created successfully",
            reaction,
        });
    }
    catch (error) {
        console.log(error);
        await t.rollback();
        return res.status(400).json({
            message: "Sorry something went wrong! toggling reaction",
        });
    }
};
exports.followProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { friendId } = req.body;
        if (friendId === req.profile.id) {
            await t.rollback();
            return res.status(400).json({ message: "You cannot follow yourself" });
        }
        const existing = await Friend.findOne({
            where: {
                userId: req.user,
                ownerId: req.profile.id,
                friendId,
            },
            transaction: t,
        });
        if (existing) {
            await t.rollback();
            return res.status(400).json({ message: "Already following this profile" });
        }
        const friend = await Friend.create({
            userId: req.user,
            ownerId: req.profile.id,
            friendId,
        }, { transaction: t });
        await Profile.increment('following', {
            by: 1,
            where: { id: req.profile.id },
            transaction: t,
        });
        await Profile.increment('followers', {
            by: 1,
            where: { id: friendId },
            transaction: t,
        });
        await t.commit();
        return res.status(201).json({
            message: "Followed successfully",
            friend,
        });
    }
    catch (error) {
        console.log(error);
        await t.rollback();
        return res.status(400).json({
            message: "Sorry something went wrong while following profile",
        });
    }
};
exports.createChat = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { type, name = null, profileIds = [] } = req.body;
        const creatorId = req.profile?.id;
        const userId = req.user;
        if (!creatorId)
            throw new Error("creatorId is required");
        if (!["private", "group"].includes(type))
            throw new Error("Invalid chat type");
        let chat;
        switch (type) {
            case "private": {
                if (profileIds.length !== 1)
                    throw new Error("Private chat requires exactly one other user");
                const otherUserId = profileIds[0];
                if (otherUserId === creatorId)
                    throw new Error("Cannot open private chat with yourself");
                const [minId, maxId] = [creatorId, otherUserId].sort();
                const existingChat = await Chat.findOne({
                    where: { type: "private" },
                    include: [
                        {
                            model: Member,
                            as: "members",
                            through: { attributes: [] },
                            where: {
                                profileId: { [Op.in]: [minId, maxId] },
                                memberType: "chat"
                            },
                        },
                    ],
                    transaction: t,
                });
                if (existingChat) {
                    await t.rollback();
                    return res.status(200).json({
                        chat: existingChat,
                        message: "Existing private chat found",
                    });
                }
                chat = await Chat.create({
                    userId,
                    profileId: creatorId,
                    type: "private",
                    createdBy: creatorId,
                }, { transaction: t });
                await Member.bulkCreate([
                    { profileId: creatorId, targetId: chat.id, memberType: "chat", isAccepted: true },
                    { profileId: otherUserId, chatId: chat.id, memberType: "chat" },
                ], { transaction: t });
                break;
            }
            case "group": {
                if (!name)
                    throw new Error("Group name is required");
                const uniqueProfileIds = Array.from(new Set([creatorId, ...profileIds]));
                chat = await Chat.create({
                    userId,
                    profileId: creatorId,
                    type: "group",
                    name,
                    createdBy: creatorId,
                }, { transaction: t });
                const members = uniqueProfileIds.map((profileId) => ({
                    targetId: chat.id,
                    profileId,
                    role: profileId === creatorId ? "admin" : "member",
                    memberType: "chat"
                }));
                await Member.bulkCreate(members, { transaction: t });
                break;
            }
            default:
                throw new Error("Unsupported chat type");
        }
        await t.commit();
        return res.status(201).json({
            chat,
            message: "Chat successfully opened",
        });
    }
    catch (error) {
        await t.rollback();
        console.error("❌ Chat creation failed:", error);
        return res.status(400).json({ message: error.message });
    }
};
exports.fetchChats = async (req, res) => {
    try {
        const profileId = req.profile.id;
        const { limit = 20, offset = 0, memberLimit = 10 } = req.query;
        const memberLinks = await Member.findAll({
            attributes: ["chatId"],
            where: { profileId },
            limit: Number(limit),
            offset: Number(offset),
        });
        const chatIds = memberLinks.map((m) => m.chatId);
        if (!chatIds.length) {
            return res.status(200).json({ chats: [], message: "No chats found" });
        }
        const chats = await Chat.findAll({
            where: { id: chatIds },
            include: [
                {
                    model: Profile,
                    as: "members",
                    attributes: ["id", "userName", "picture"],
                    through: { attributes: [] },
                    limit: Number(memberLimit),
                },
                {
                    model: Profile,
                    as: "creator",
                    attributes: ["id", "userName", "picture"],
                },
            ],
            order: [["updatedAt", "DESC"]],
            limit: Number(limit),
            offset: Number(offset),
        });
        return res.status(200).json({
            message: "Chats fetched successfully!",
            chats,
        });
    }
    catch (err) {
        console.error("❌ fetchChats error:", err);
        return res.status(400).json({ message: err.message });
    }
};
exports.joinCommunity = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { communityId } = req.body;
        const profileId = req.profile.id;
        const community = await Community.findByPk(communityId);
        if (!community) {
            await transaction.rollback();
            return res.status(404).json({ message: "Sorry community not found" });
        }
        if (community.visibility === "invite_only") {
            await transaction.rollback();
            return res.status(403).json({
                message: "Sorry this community is invite-only. You need an invitation to join.",
            });
        }
        const [member, created] = await CommunityMember.findOrCreate({
            where: { communityId, profileId },
            defaults: { role: "member" },
            transaction,
        });
        await transaction.commit();
        if (!created) {
            return res.status(200).json({ message: "Sorry you are already a member" });
        }
        return res.status(201).json({
            message: "Successfully joined the community!",
            member,
        });
    }
    catch (error) {
        await transaction.rollback();
        console.error("Join community error:", error);
        return res.status(500).json({ message: "Sorry failed to join community" });
    }
};
