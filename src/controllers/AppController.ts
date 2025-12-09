import { Request, Response } from "express";
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
import { MemberRole, MemberType } from "../models/types/member.types";
import { errorHandler } from "../handlers/responseHandlers";
import { PostTargetType, PostType } from "../models/types/post.types";
import { BranchAmenity } from "../models/BranchAmenity";

const { sequelize } = db;


export const createPost = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const {
      body,
      postType = "normal",
      target,
      amenities = null,
      branchId
    } = req.body;

    if (!body || body.trim() === "") {
      await t.rollback();
      return res.status(400).json({ message: "Post body cannot be empty." });
    }

    if (![PostType.NORMAL, PostType.REVIEW].includes(postType)) {
      await t.rollback();
      return errorHandler(res, `Invalid post type. Type can only be one of the following: ${Object.values(PostType).join(", ")}`, 400);
    }

    if (!target || isNaN(Number(target))) {
      await t.rollback();
      return errorHandler(res, "Invalid target for the post.", 400);
    }

    if (postType === PostType.REVIEW && !branchId) {
      await t.rollback();
      return errorHandler(res, "Branch ID is required when creating a review post.", 400);
    }

    const userId = req.user;
    const profileId = req.profile!.id;
    let finalBranchId: number;


    if (!branchId) {
      finalBranchId = req.branch!;

      if (!finalBranchId) {
        await t.rollback();
        return errorHandler(res, "Invalid branch ID.", 400);
      }
    }

    let media: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      media = req.files.map((file: any) => file.location || file.path);
    }

    let parsedAmenities: Record<string, number> = {};
    let finalRating: Record<string, number> = {};

    switch (postType) {
      case PostType.NORMAL:
        // might take out in future if business as a whole is posting and not individual branches
        finalBranchId = req.branch!;

         if (!finalBranchId) {
        await t.rollback();
        return errorHandler(res, "Invalid branch ID.", 400);
      }
        break;

      case PostType.REVIEW:
        finalBranchId = Number(branchId);
        const branch = await Branch.findOne({
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
            const amenityRecord = await BranchAmenity.findOne({
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
              totalRating: (amenityRecord.get("totalRating") as number) || 0,
              ratingCount: (amenityRecord.get("ratingCount") as number) || 0,
            });

            // Apply rating update
            amenityRecord.totalRating += ratingValue;
            amenityRecord.ratingCount += 1;
            amenityRecord.rating = amenityRecord.totalRating / amenityRecord.ratingCount;

            await amenityRecord.save({ transaction: t });

          } catch (err) {
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

    const post = await Post.create(
      {
        userId,
        profileId,
        branchId: finalBranchId,
        body,
        postType,
        // reviewTarget: finalReviewTarget, // doesn't exist in Post model
        targetId: Number(target),
        targetType: postType === PostType.REVIEW ? PostTargetType.BUSINESS : PostTargetType.COMMUNITY,
        media,
        rating: finalRating,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({ post, message: "Post created successfully!" });
  } catch (error) {
    await t.rollback();
    console.error("Error creating post:", error);
    return res.status(400).json({ message: "Sorry, something went wrong!" });
  }
};

export const fetchPosts = async (req: Request, res: Response) => {
  try {
    const { offset = 0, search = "", type = null } = req.query;

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
          return res.status(400).json({
            message: "Invalid type. Allowed types: 'normal' or 'review'.",
          });
        }
    }

    const posts = await Post.findAll({
      where: whereClause,
      include: includeArray,
      limit: 20,
      offset: parseInt(offset as string, 10),
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      posts,
      message: "Posts fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(400).json({ message: "Failed to fetch posts" });
  }
};

export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const {
      search = "",
      offset = 0,
      location = "",
      amenity = "",
      businessType,
      type = ""
    } = req.query as any;

    const query: any = {};
    const radius = 10000; // in meters

    if (search && search.trim() !== "") {
      query.name = { [Op.like]: `%${search.trim()}%` }; // search by branch name
    }

    if (location && location.includes(",")) {
      const [lat, lng] = location.split(",").map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        query[Op.and] = where(
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

    res.status(200).json({
      branches,
      message: "Branches with profiles fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      message: "Something went wrong while searching profiles",
    });
  }
};

export const viewBusiness = async (req: Request, res: Response) => {
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
      return res.status(404).json({ message: "Business not found" });
    }

    return res.status(200).json({
      branch,
      message: "Business fetched successfully!",
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({
      message: "Something went wrong while fetching business details",
    });
  }
};

export const makeComment = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { postId, body, parentId = null } = req.body;

    const comment = await Comment.create({
      postId,
      body,
      userId: req.user,
      profileId: req.profile!.id,
      parentId
    }, { transaction: t });

    await Post.increment(
      { comments: 1 },
      { where: { id: postId }, transaction: t }
    );
    await t.commit();
    return res.status(201).json({ comment, message: "Comment created successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Create comment error:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const toggleReaction = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { targetId, targetType, type } = req.body;
    const validTargets: Record<string, any> = { comment: Comment, post: Post };
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
      await validTargets[targetType].decrement(
        { likes: 1 },
        { where: { id: targetId }, transaction: t }
      );

      await t.commit();
      return res.status(200).json({
        message: "Reaction removed successfully"
      });
    }
    await validTargets[targetType].increment(
      { likes: 1 },
      { where: { id: targetId }, transaction: t }
    );

    const reaction = await Reaction.create(
      {
        userId: req.user,
        profileId: req.profile!.id,
        type,
        targetId,
        targetType,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      message: "Reaction created successfully",
      reaction,
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({
      message: "Something went wrong! toggling reaction",
    });
  }
};

export const followProfile = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { friendId } = req.body;

    if (friendId === req.profile?.id) {
      await t.rollback();
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await Friend.findOne({
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


    const friend = await Friend.create(
      {
        userId: req.user,
        ownerId: req.profile!.id,
        friendId,
      },
      { transaction: t }
    );


    await Profile.increment('following', {
      by: 1,
      where: { id: req.profile?.id },
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
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({
      message: "Something went wrong while following profile",
    });
  }
};

export const createChat = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { type, name = null, profileIds = [] } = req.body;

    const creatorId = req.profile?.id;
    const userId = req.user
    if (!creatorId) return res.status(400).json({ message: "creatorId is required" });
    if (!["private", "group"].includes(type)) throw new Error("Invalid chat type");

    let chat: Chat;

    switch (type) {

      case "private": {
        if (profileIds.length !== 1)
          return res.status(400).json({ message: "Private chat requires exactly one other user" });

        const otherUserId = profileIds[0];
        if (otherUserId === creatorId)
          return res.status(400).json({ message: "Cannot open private chat with yourself" });


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
          return res.status(200).json({
            chat: existingChat,
            message: "Existing private chat found",
          });
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
            { profileId: otherUserId, targetId: chat.id, memberType: MemberType.CHAT }, // changed chatId to targetId, chatId doesn't exist in Member model
          ],
          { transaction: t }
        );

        break;
      }

      case "group": {
        if (!name) return res.status(400).json({ message: "Group name is required" });

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
        return res.status(400).json({ message: "Unsupported chat type" });
    }
    await t.commit();

    return res.status(201).json({
      chat,
      message: "Chat successfully opened",
    });
  } catch (error: any) {
    await t.rollback();
    console.error("❌ Chat creation failed:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const fetchChats = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile?.id;
    const { limit = "20", offset = "0", memberLimit = "10" } = req.query as any;

    const memberLinks: Member[] = await Member.findAll({
      // attributes: ["chatId"],
      attributes: ["targetId"], // changed chatId to targetId, chatId doesn't exist in Member model
      where: { profileId, memberType: MemberType.CHAT },
      limit: Number(limit),
      offset: Number(offset),
    });

    const chatIds = memberLinks.map((m) => m.targetId);

    if (!chatIds.length) {
      return res.status(200).json({ chats: [], message: "No chats found" });
    }


    const chats = await Chat.findAll({
      where: { id: chatIds },
      include: [
        {
          model: Member,
          as: "members",
          // attributes: ["id", "userName", "picture"],
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

    return res.status(200).json({
      message: "Chats fetched successfully!",
      chats,
    });

  } catch (err: any) {
    console.error("❌ fetchChats error:", err);
    return res.status(400).json({ message: err.message });
  }
};

export const joinCommunity = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { communityId } = req.body;
    const profileId = req.profile!.id;

    const community = await Community.findByPk(communityId);

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

    if (!created) {
      return res.status(200).json({ message: "You are already a member" });
    }

    return res.status(201).json({
      message: "Successfully joined the community!",
      member,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Join community error:", error);
    return res.status(500).json({ message: "Failed to join community" });
  }
};





