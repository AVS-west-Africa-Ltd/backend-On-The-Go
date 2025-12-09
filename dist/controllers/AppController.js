"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinCommunity = exports.fetchChats = exports.createChat = exports.followProfile = exports.toggleReaction = exports.makeComment = exports.viewBusiness = exports.searchBusinesses = exports.fetchPosts = exports.createPost = void 0;
const models_1 = __importDefault(require("../models"));
const sequelize_1 = require("sequelize");
const Chat_1 = require("../models/Chat");
const Member_1 = require("../models/Member");
const Community_1 = require("../models/Community");
const Profile_1 = require("../models/Profile");
const Post_1 = require("../models/Post");
const Amenity_1 = require("../models/Amenity");
const Branch_1 = require("../models/Branch");
const Comment_1 = require("../models/Comment");
const Reaction_1 = require("../models/Reaction");
const Friend_1 = require("../models/Friend");
const Media_1 = require("../models/Media");
const member_types_1 = require("../models/types/member.types");
const responseHandlers_1 = require("../handlers/responseHandlers");
const post_types_1 = require("../models/types/post.types");
const BranchAmenity_1 = require("../models/BranchAmenity");
const { sequelize } = models_1.default;
const createPost = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { body, postType = "normal", target, amenities = null, branchId } = req.body;
        if (!body || body.trim() === "") {
            await t.rollback();
            return res.status(400).json({ message: "Post body cannot be empty." });
        }
        if (![post_types_1.PostType.NORMAL, post_types_1.PostType.REVIEW].includes(postType)) {
            await t.rollback();
            return (0, responseHandlers_1.errorHandler)(res, `Invalid post type. Type can only be one of the following: ${Object.values(post_types_1.PostType).join(", ")}`, 400);
        }
        if (!target || isNaN(Number(target))) {
            await t.rollback();
            return (0, responseHandlers_1.errorHandler)(res, "Invalid target for the post.", 400);
        }
        if (postType === post_types_1.PostType.REVIEW && !branchId) {
            await t.rollback();
            return (0, responseHandlers_1.errorHandler)(res, "Branch ID is required when creating a review post.", 400);
        }
        const userId = req.user;
        const profileId = req.profile.id;
        let finalBranchId;
        if (!branchId) {
            finalBranchId = req.branch;
            if (!finalBranchId) {
                await t.rollback();
                return (0, responseHandlers_1.errorHandler)(res, "Invalid branch ID.", 400);
            }
        }
        let media = [];
        if (req.files && Array.isArray(req.files)) {
            media = req.files.map((file) => file.location || file.path);
        }
        let parsedAmenities = {};
        let finalRating = {};
        switch (postType) {
            case post_types_1.PostType.NORMAL:
                // might take out in future if business as a whole is posting and not individual branches
                finalBranchId = req.branch;
                if (!finalBranchId) {
                    await t.rollback();
                    return (0, responseHandlers_1.errorHandler)(res, "Invalid branch ID.", 400);
                }
                break;
            case post_types_1.PostType.REVIEW:
                finalBranchId = Number(branchId);
                const branch = await Branch_1.Branch.findOne({
                    where: { id: Number(finalBranchId), profileId: Number(target) },
                    transaction: t,
                });
                if (!branch) {
                    await t.rollback();
                    return res.status(400).json({
                        message: "Only a business profile can be reviewed.",
                    });
                }
                parsedAmenities =
                    typeof amenities === "object" && !Array.isArray(amenities)
                        ? amenities
                        : JSON.parse(amenities || "{}");
                for (const [amenityId, ratingValue] of Object.entries(parsedAmenities)) {
                    try {
                        const amenityRecord = await BranchAmenity_1.BranchAmenity.findOne({
                            where: {
                                branchId: finalBranchId,
                                businessId: branch.profileId,
                                amenityId,
                            },
                            transaction: t,
                        });
                        if (!amenityRecord) {
                            console.warn(`⚠️ Rating skipped: Amenity not found (${amenityId})`);
                            continue; // move to next rating key, DO NOT EXIT
                        }
                        // Initialize missing counters if needed (optional safeguard)
                        amenityRecord.set({
                            totalRating: amenityRecord.get("totalRating") || 0,
                            ratingCount: amenityRecord.get("ratingCount") || 0,
                        });
                        // Apply rating update
                        amenityRecord.totalRating += ratingValue;
                        amenityRecord.ratingCount += 1;
                        amenityRecord.rating = amenityRecord.totalRating / amenityRecord.ratingCount;
                        await amenityRecord.save({ transaction: t });
                    }
                    catch (err) {
                        console.error(`❌ Error processing amenity rating (${amenityId}):`, err);
                        // continue loop, don't fail post
                        continue;
                    }
                }
                finalRating = parsedAmenities;
                break;
            default:
                await t.rollback();
                return res.status(400).json({
                    message: `Invalid post type: ${postType}`,
                });
        }
        const post = await Post_1.Post.create({
            userId,
            profileId,
            branchId: finalBranchId,
            body,
            postType,
            // reviewTarget: finalReviewTarget, // doesn't exist in Post model
            targetId: Number(target),
            targetType: postType === post_types_1.PostType.REVIEW ? post_types_1.PostTargetType.BUSINESS : post_types_1.PostTargetType.COMMUNITY,
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
exports.createPost = createPost;
const fetchPosts = async (req, res) => {
    try {
        const { offset = 0, search = "", type = null } = req.query;
        const whereClause = {};
        if (search) {
            whereClause[sequelize_1.Op.or] = [{ body: { [sequelize_1.Op.like]: `%${search}%` } }];
        }
        let includeArray = [];
        switch (type) {
            case post_types_1.PostType.NORMAL:
                whereClause.postType = post_types_1.PostType.NORMAL;
                includeArray = [
                    {
                        model: Branch_1.Branch,
                        as: "branch",
                        required: false,
                        include: [
                            {
                                model: Profile_1.Profile,
                                as: "profile",
                                required: false,
                                attributes: ["id", "userName", "profileType", "picture"],
                            },
                        ],
                    },
                ];
                break;
            case post_types_1.PostType.REVIEW:
                whereClause.postType = post_types_1.PostType.REVIEW;
                includeArray = [
                    {
                        model: Profile_1.Profile,
                        as: "business",
                        required: false,
                        attributes: ["id", "userName", "profileType", "picture"],
                    },
                    {
                        model: Profile_1.Profile,
                        as: "author",
                        required: false,
                        attributes: ["id", "userName", "profileType", "picture"],
                    },
                ];
                break;
            default:
                if (type) {
                    return res.status(400).json({
                        message: "Invalid type. Allowed types: 'normal' or 'review'.",
                    });
                }
        }
        const posts = await Post_1.Post.findAll({
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
exports.fetchPosts = fetchPosts;
const searchBusinesses = async (req, res) => {
    try {
        const { search = "", offset = 0, location = "", amenity = "", businessType, type = "" } = req.query;
        const query = {};
        const radius = 10000; // in meters
        if (search && search.trim() !== "") {
            query.name = { [sequelize_1.Op.like]: `%${search.trim()}%` }; // search by branch name
        }
        if (location && location.includes(",")) {
            const [lat, lng] = location.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                query[sequelize_1.Op.and] = (0, sequelize_1.where)((0, sequelize_1.fn)("ST_Distance_Sphere", (0, sequelize_1.col)("geoLocation"), (0, sequelize_1.fn)("ST_GeomFromText", `POINT(${lng} ${lat})`)), { [sequelize_1.Op.lte]: radius });
            }
        }
        const branches = await Branch_1.Branch.findAll({
            where: query,
            include: [
                {
                    model: Profile_1.Profile,
                    as: "profile", // the profile the branch belongs to
                    required: true,
                    where: {
                        profileType: { [sequelize_1.Op.eq]: type.trim() },
                        ...(businessType && { businessType: { [sequelize_1.Op.like]: `%${businessType.trim()}%` } }),
                    },
                    attributes: ["id", "userName", "profileType", "picture", "businessType"],
                },
                {
                    model: Amenity_1.Amenity,
                    as: "amenities",
                    required: amenity && amenity.trim() !== "" ? true : false,
                    where: amenity && amenity.trim() !== ""
                        ? { name: { [sequelize_1.Op.eq]: amenity.trim() } }
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
            message: "Something went wrong while searching profiles",
        });
    }
};
exports.searchBusinesses = searchBusinesses;
const viewBusiness = async (req, res) => {
    try {
        const { branchId } = req.params;
        const branch = await Branch_1.Branch.findOne({
            where: { id: branchId },
            include: [
                {
                    model: Profile_1.Profile,
                    as: "profile",
                    include: [
                        {
                            model: Media_1.Media,
                            as: "media"
                        }, {
                            model: Post_1.Post,
                            as: "reviews",
                            where: {
                                postType: post_types_1.PostType.REVIEW
                            },
                            required: false,
                            include: [
                                {
                                    model: Profile_1.Profile,
                                    as: "author"
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Amenity_1.Amenity,
                    as: "amenities",
                },
            ],
        });
        if (!branch) {
            return res.status(404).json({ message: "Business not found" });
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
exports.viewBusiness = viewBusiness;
const makeComment = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { postId, body, parentId = null } = req.body;
        const comment = await Comment_1.Comment.create({
            postId,
            body,
            userId: req.user,
            profileId: req.profile.id,
            parentId
        }, { transaction: t });
        await Post_1.Post.increment({ comments: 1 }, { where: { id: postId }, transaction: t });
        await t.commit();
        return res.status(201).json({ comment, message: "Comment created successfully" });
    }
    catch (error) {
        await t.rollback();
        console.error("Create comment error:", error);
        res.status(500).json({ message: "Failed to create comment" });
    }
};
exports.makeComment = makeComment;
const toggleReaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { targetId, targetType, type } = req.body;
        const validTargets = { comment: Comment_1.Comment, post: Post_1.Post };
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
        const existingReaction = await Reaction_1.Reaction.findOne({
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
        const reaction = await Reaction_1.Reaction.create({
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
            message: "Something went wrong! toggling reaction",
        });
    }
};
exports.toggleReaction = toggleReaction;
const followProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { friendId } = req.body;
        if (friendId === req.profile?.id) {
            await t.rollback();
            return res.status(400).json({ message: "You cannot follow yourself" });
        }
        const existing = await Friend_1.Friend.findOne({
            where: {
                userId: req.user,
                ownerId: req.profile?.id,
                friendId,
            },
            transaction: t,
        });
        if (existing) {
            await t.rollback();
            return res.status(400).json({ message: "Already following this profile" });
        }
        const friend = await Friend_1.Friend.create({
            userId: req.user,
            ownerId: req.profile.id,
            friendId,
        }, { transaction: t });
        await Profile_1.Profile.increment('following', {
            by: 1,
            where: { id: req.profile?.id },
            transaction: t,
        });
        await Profile_1.Profile.increment('followers', {
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
            message: "Something went wrong while following profile",
        });
    }
};
exports.followProfile = followProfile;
const createChat = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { type, name = null, profileIds = [] } = req.body;
        const creatorId = req.profile?.id;
        const userId = req.user;
        if (!creatorId)
            return res.status(400).json({ message: "creatorId is required" });
        if (!["private", "group"].includes(type))
            throw new Error("Invalid chat type");
        let chat;
        switch (type) {
            case "private": {
                if (profileIds.length !== 1)
                    return res.status(400).json({ message: "Private chat requires exactly one other user" });
                const otherUserId = profileIds[0];
                if (otherUserId === creatorId)
                    return res.status(400).json({ message: "Cannot open private chat with yourself" });
                const [minId, maxId] = [creatorId, otherUserId].sort();
                const existingChat = await Chat_1.Chat.findOne({
                    where: { type: "private" },
                    include: [
                        {
                            model: Member_1.Member,
                            as: "members",
                            through: { attributes: [] },
                            where: {
                                profileId: { [sequelize_1.Op.in]: [minId, maxId] },
                                memberType: member_types_1.MemberType.CHAT,
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
                chat = await Chat_1.Chat.create({
                    userId,
                    profileId: creatorId,
                    type: "private",
                }, { transaction: t });
                await Member_1.Member.bulkCreate([
                    { profileId: creatorId, targetId: chat.id, memberType: member_types_1.MemberType.CHAT, isAccepted: true },
                    { profileId: otherUserId, targetId: chat.id, memberType: member_types_1.MemberType.CHAT }, // changed chatId to targetId, chatId doesn't exist in Member model
                ], { transaction: t });
                break;
            }
            case "group": {
                if (!name)
                    return res.status(400).json({ message: "Group name is required" });
                const uniqueProfileIds = Array.from(new Set([creatorId, ...profileIds]));
                chat = await Chat_1.Chat.create({
                    userId,
                    profileId: creatorId,
                    type: "group",
                    name,
                }, { transaction: t });
                const members = uniqueProfileIds.map((profileId) => ({
                    targetId: chat.id,
                    profileId,
                    role: profileId === creatorId ? member_types_1.MemberRole.ADMIN : member_types_1.MemberRole.MEMBER,
                    memberType: member_types_1.MemberType.CHAT,
                }));
                await Member_1.Member.bulkCreate(members, { transaction: t });
                break;
            }
            default:
                return res.status(400).json({ message: "Unsupported chat type" });
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
exports.createChat = createChat;
const fetchChats = async (req, res) => {
    try {
        const profileId = req.profile?.id;
        const { limit = "20", offset = "0", memberLimit = "10" } = req.query;
        const memberLinks = await Member_1.Member.findAll({
            // attributes: ["chatId"],
            attributes: ["targetId"], // changed chatId to targetId, chatId doesn't exist in Member model
            where: { profileId, memberType: member_types_1.MemberType.CHAT },
            limit: Number(limit),
            offset: Number(offset),
        });
        const chatIds = memberLinks.map((m) => m.targetId);
        if (!chatIds.length) {
            return res.status(200).json({ chats: [], message: "No chats found" });
        }
        const chats = await Chat_1.Chat.findAll({
            where: { id: chatIds },
            include: [
                {
                    model: Member_1.Member,
                    as: "members",
                    // attributes: ["id", "userName", "picture"],
                    through: { attributes: [] },
                    limit: Number(memberLimit),
                    include: [
                        {
                            model: Profile_1.Profile,
                            as: "profile",
                            attributes: ["id", "userName", "picture"],
                        }
                    ]
                },
                {
                    model: Profile_1.Profile,
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
exports.fetchChats = fetchChats;
const joinCommunity = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { communityId } = req.body;
        const profileId = req.profile.id;
        const community = await Community_1.Community.findByPk(communityId);
        if (!community) {
            await transaction.rollback();
            return res.status(404).json({ message: "Community not found" });
        }
        if (community.visibility === "invite_only") {
            await transaction.rollback();
            return res.status(403).json({
                message: "Sorry this community is invite-only. You need an invitation to join.",
            });
        }
        const [member, created] = await Member_1.Member.findOrCreate({
            where: { targetId: communityId, profileId, memberType: "community" },
            defaults: {
                targetId: communityId,
                profileId,
                role: "member",
                memberType: "community",
                isAccepted: true
            },
            transaction,
        });
        await transaction.commit();
        if (!created) {
            return res.status(200).json({ message: "You are already a member" });
        }
        return res.status(201).json({
            message: "Successfully joined the community!",
            member,
        });
    }
    catch (error) {
        await transaction.rollback();
        console.error("Join community error:", error);
        return res.status(500).json({ message: "Failed to join community" });
    }
};
exports.joinCommunity = joinCommunity;
