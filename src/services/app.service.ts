import db from "../models";
import { fn, col, where, Op } from "sequelize";
import { Chat } from "../models/Chat";
import { Member } from "../models/Member";
import { Community } from "../models/Community";
import { Profile } from "../models/Profile";
import { Post } from "../models/Post";
import { Amenity } from "../models/Amenity";
import { Branch } from "../models/Branch";
import { Comment } from "../models/Comment";
import { Reaction } from "../models/Reaction";
import { Friend } from "../models/Friend";
import { Media } from "../models/Media";
import { ProfileVisit } from "../models/ProfileVisit";
import { MemberRole, MemberType } from "../models/types/member.types";
import { PostTargetType, PostType } from "../models/types/post.types";
import { BranchAmenity } from "../models/BranchAmenity";
import { ICreatePostPayload } from "../interfaces/post.interface";
import { BranchStaff } from "../models/BranchStaff";
import { BranchStaffRole } from "../models/types/branchStaff.types";
import { AppError } from "../utils/errors";

const { sequelize } = db;

export class AppService {
    static async createPost(
        payload: ICreatePostPayload,
        userId: number,
        profileId: number
    ) {
        const t = await sequelize.transaction();
        try {
            const {
                body,
                postType = "normal",
                target,
                amenities = null,
                branchId,
                targetType: targetTypeFromPayload,
                media = []
            } = payload;

            const finalBranchId = Number(branchId);

            const branch = await Branch.findByPk(finalBranchId, { transaction: t });
            if (!branch) {
                throw new Error("Branch not found.");
            }

            if (postType === PostType.NORMAL) {
                const isOwner = branch.profileId === profileId;
                if (!isOwner) {
                    const isStaff = await BranchStaff.findOne({
                        where: {
                            branchId: finalBranchId,
                            userId: userId,
                            role: [BranchStaffRole.ADMIN, BranchStaffRole.SUPER_ADMIN],
                            isActive: true
                        },
                        transaction: t
                    });
                    if (!isStaff) {
                        throw new Error("You do not have access to post for this branch.");
                    }
                }
            }

            let finalRating: Record<string, number> = {};

            switch (postType) {
                case PostType.NORMAL:
                    break;

                case PostType.REVIEW:
                    if (branch.profileId === profileId) {
                        throw new AppError("You cannot review your own branch.", 400);
                    }

                    const ratingsInput = typeof amenities === "object" && !Array.isArray(amenities)
                        ? amenities as Record<string, number>
                        : JSON.parse(typeof amenities === "string" ? amenities : "{}");

                    // The UI shows: Overall, Wi-Fi, Co-working, Food
                    finalRating = ratingsInput;

                    // Update BranchAmenity ratings for specific amenities (excluding 'overall')
                    for (const [amenityId, ratingValue] of Object.entries(ratingsInput)) {
                        if (amenityId === 'overall') continue;

                        try {
                            const amenityRecord = await BranchAmenity.findOne({
                                where: {
                                    branchId: finalBranchId,
                                    id: amenityId,
                                },
                                transaction: t,
                            });

                            if (!amenityRecord) {
                                console.error("Not found", amenityRecord);
                                continue
                            };

                            const currentTotal = Number(amenityRecord.totalRating || 0);
                            const currentCount = Number(amenityRecord.ratingCount || 0);

                            await amenityRecord.update({
                                totalRating: currentTotal + Number(ratingValue),
                                ratingCount: currentCount + 1,
                                rating: (currentTotal + Number(ratingValue)) / (currentCount + 1)
                            }, { transaction: t });



                        } catch (err) {
                            console.error(`❌ Error processing amenity rating (${amenityId}):`, err);
                        }
                    }
                    // Update Branch table rating
                    const overallRating = Number(ratingsInput.overall || 0);
                    if (overallRating > 0) {
                        const currentRatingCount = Number(branch.ratingCount || 0);
                        const currentReviewCount = Number(branch.reviewCount || 0);

                        await branch.update({
                            ratingCount: currentRatingCount + overallRating,
                            reviewCount: currentReviewCount + 1,
                            rating: (currentRatingCount + overallRating) / (currentReviewCount + 1)
                        }, { transaction: t });
                    }
                    break;

                default:
                    throw new Error(`Invalid post type: ${postType}`);
            }

            const post = await Post.create(
                {
                    userId,
                    profileId,
                    branchId: finalBranchId,
                    body,
                    postType,
                    targetId: Number(target),
                    targetType: postType === PostType.REVIEW ? PostTargetType.BUSINESS : (targetTypeFromPayload || PostTargetType.COMMUNITY),
                    media,
                    rating: finalRating,
                },
                { transaction: t }
            );

            await t.commit();
            return post;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async fetchPosts(query: any) {
        const { offset = 0, search = "", type = null } = query;

        const whereClause: any = {};

        if (search) {
            whereClause[Op.or] = [{ body: { [Op.like]: `%${search}%` } }];
        }

        let includeArray: any[] = [];

        switch (type) {
            case PostType.NORMAL:
                whereClause.postType = PostType.NORMAL;
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
                                attributes: ["id", "userName", "profileType", "picture"],
                            },
                        ],
                    },
                ];
                break;

            case PostType.REVIEW:
                whereClause.postType = PostType.REVIEW;
                includeArray = [
                    {
                        model: Profile,
                        as: "business",
                        required: false,
                        attributes: ["id", "userName", "profileType", "picture"],
                    },
                    {
                        model: Profile,
                        as: "author",
                        required: false,
                        attributes: ["id", "userName", "profileType", "picture"],
                    },
                ];
                break;

            default:
                if (type) {
                    throw new Error("Invalid type. Allowed types: 'normal' or 'review'.");
                }
        }

        const posts = await Post.findAll({
            where: whereClause,
            include: includeArray,
            limit: 20,
            offset: parseInt(offset as string, 10),
            order: [["createdAt", "DESC"]],
        });

        return posts;
    }

    static async searchBusinesses(query: any) {
        const {
            search = "",
            offset = 0,
            location = "",
            amenity = "",
            businessType,
            type = ""
        } = query;

        const dbQuery: any = {};
        const radius = 10000; // in meters

        if (search && search.trim() !== "") {
            dbQuery.name = { [Op.like]: `%${search.trim()}%` };
        }

        if (location && location.includes(",")) {
            const [lat, lng] = location.split(",").map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                dbQuery[Op.and] = where(
                    fn(
                        "ST_Distance_Sphere",
                        col("geoLocation"),
                        fn("ST_GeomFromText", `POINT(${lng} ${lat})`)
                    ),
                    { [Op.lte]: radius }
                );
            }
        }

        const branches = await Branch.findAll({
            where: dbQuery,
            include: [
                {
                    model: Profile,
                    as: "profile",
                    required: true,
                    where: {
                        profileType: { [Op.eq]: type.trim() },
                        ...(businessType && { businessType: { [Op.like]: `%${businessType.trim()}%` } }),
                    },
                    attributes: ["id", "userName", "profileType", "picture", "businessType"],
                },
                {
                    model: Amenity,
                    as: "amenities",
                    required: amenity && amenity.trim() !== "" ? true : false,
                    where:
                        amenity && amenity.trim() !== ""
                            ? { name: { [Op.eq]: amenity.trim() } }
                            : undefined,
                },
            ],
            limit: 20,
            offset: Number(offset) || 0,
            order: [["createdAt", "DESC"]],
        });

        return branches;
    }

    static async viewBusiness(branchId: string) {
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
                                postType: PostType.REVIEW
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
            throw new Error("Business not found");
        }

        if (branch && branch.profile) {
            await ProfileVisit.create({
                profileId: branch.profile.id,
                userId: null,
            });
        }

        return branch;
    }

    static async makeComment(data: any, userId: number, profileId: number) {
        const t = await sequelize.transaction();
        try {
            const { postId, body, parentId = null } = data;

            const comment = await Comment.create({
                postId,
                body,
                userId,
                profileId,
                parentId
            }, { transaction: t });

            await Post.increment(
                { comments: 1 },
                { where: { id: postId }, transaction: t }
            );
            await t.commit();
            return comment;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async toggleReaction(data: any, userId: number, profileId: number) {
        const t = await sequelize.transaction();
        try {
            const { targetId, targetType, type } = data;
            const validTargets: Record<string, any> = { comment: Comment, post: Post };
            const validReactions = ['like', 'dislike', 'love'];

            if (!targetId || !targetType || !type) {
                throw new Error("Missing required fields");
            }

            if (!validTargets[targetType]) {
                throw new Error("Invalid target type");
            }

            if (!validReactions.includes(type)) {
                throw new Error("Invalid reaction type");
            }

            const existingReaction = await Reaction.findOne({
                where: {
                    userId,
                    targetId,
                    targetType,
                },
                transaction: t,
            });

            if (existingReaction) {
                await existingReaction.destroy({ transaction: t });
                await validTargets[targetType].decrement(
                    { likes: 1 },
                    { where: { id: targetId }, transaction: t }
                );

                await t.commit();
                return { message: "Reaction removed successfully", reaction: null };
            }

            await validTargets[targetType].increment(
                { likes: 1 },
                { where: { id: targetId }, transaction: t }
            );

            const reaction = await Reaction.create(
                {
                    userId,
                    profileId,
                    type,
                    targetId,
                    targetType,
                },
                { transaction: t }
            );

            await t.commit();
            return { message: "Reaction created successfully", reaction };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async followProfile(friendId: number, userId: number, profileId: number) {
        const t = await sequelize.transaction();
        try {
            if (friendId === profileId) {
                throw new Error("You cannot follow yourself");
            }

            const existing = await Friend.findOne({
                where: {
                    userId,
                    ownerId: profileId,
                    friendId,
                },
                transaction: t,
            });

            if (existing) {
                throw new Error("Already following this profile");
            }

            const friend = await Friend.create(
                {
                    userId,
                    ownerId: profileId,
                    friendId,
                },
                { transaction: t }
            );

            await Profile.increment('following', {
                by: 1,
                where: { id: profileId },
                transaction: t,
            });

            await Profile.increment('followers', {
                by: 1,
                where: { id: friendId },
                transaction: t,
            });

            await t.commit();
            return friend;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async createChat(data: any, userId: number, creatorId: number) {
        const t = await sequelize.transaction();
        try {
            const { type, name = null, profileIds = [] } = data;

            if (!creatorId) throw new Error("creatorId is required");
            if (!["private", "group"].includes(type)) throw new Error("Invalid chat type");

            let chat: Chat;

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
                                    memberType: MemberType.CHAT,
                                },
                            },
                        ],
                        transaction: t,
                    });

                    if (existingChat) {
                        await t.rollback();
                        return { chat: existingChat, isExisting: true };
                    }

                    chat = await Chat.create(
                        {
                            userId,
                            profileId: creatorId,
                            type: "private",
                        },
                        { transaction: t }
                    );

                    await Member.bulkCreate(
                        [
                            { profileId: creatorId, targetId: chat.id, memberType: MemberType.CHAT, isAccepted: true },
                            { profileId: otherUserId, targetId: chat.id, memberType: MemberType.CHAT },
                        ],
                        { transaction: t }
                    );

                    break;
                }

                case "group": {
                    if (!name) throw new Error("Group name is required");

                    const uniqueProfileIds = Array.from(new Set([creatorId, ...profileIds]));

                    chat = await Chat.create(
                        {
                            userId,
                            profileId: creatorId,
                            type: "group",
                            name,
                        },
                        { transaction: t }
                    );

                    const members = uniqueProfileIds.map((profileId) => ({
                        targetId: chat.id,
                        profileId,
                        role: profileId === creatorId ? MemberRole.ADMIN : MemberRole.MEMBER,
                        memberType: MemberType.CHAT,
                    }));

                    await Member.bulkCreate(members, { transaction: t });

                    break;
                }

                default:
                    throw new Error("Unsupported chat type");
            }

            await t.commit();
            return { chat, isExisting: false };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async fetchChats(profileId: number, query: any) {
        const { limit = "20", offset = "0", memberLimit = "10" } = query;

        const memberLinks: Member[] = await Member.findAll({
            attributes: ["targetId"],
            where: { profileId, memberType: MemberType.CHAT },
            limit: Number(limit),
            offset: Number(offset),
        });

        const chatIds = memberLinks.map((m) => m.targetId);

        if (!chatIds.length) {
            return [];
        }

        const chats = await Chat.findAll({
            where: { id: chatIds },
            include: [
                {
                    model: Member,
                    as: "members",
                    through: { attributes: [] },
                    limit: Number(memberLimit),
                    include: [
                        {
                            model: Profile,
                            as: "profile",
                            attributes: ["id", "userName", "picture"],
                        }
                    ]
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

        return chats;
    }

    static async joinCommunity(communityId: number, profileId: number) {
        const transaction = await sequelize.transaction();
        try {

            const community = await Community.findByPk(communityId);

            if (!community) {
                throw new Error("Community not found");
            }

            if (community.visibility === "invite_only") {
                throw new Error("Sorry this community is invite-only. You need an invitation to join.");
            }

            const [member, created] = await Member.findOrCreate({
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
            return { member, created };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async leaveCommunity(communityId: string, profileId: number) {
        const transaction = await sequelize.transaction();
        try {
            const member = await Member.findOne({
                where: {
                    targetId: communityId,
                    profileId,
                    memberType: "community"
                },
                transaction
            });

            if (!member) {
                throw new Error("You are not a member of this community");
            }

            await member.destroy({ transaction });

            await transaction.commit();
            return { message: "Successfully left the community" };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async fetchCommunities(query: any) {
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
}
