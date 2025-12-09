import { errorHandler } from "../handlers/responseHandlers";
import { Op } from "sequelize";
import db from "../models";
import { Request, Response } from "express";
import { randomCharacters } from "../utils/helpers";

const { sequelize, Community, Member, Profile } = db;


export const create = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, description, type, visibility } = req.body;
    const userId = req.user;
    const profileId = req.profile!.id;

    if (!name) {
      await transaction.rollback();
      return errorHandler(res, "Community name is required", 400);
    }

    const community = await Community.create(
      {
        userId,
        profileId,
        name,
        photo: req.file?.location || null,
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
    return res.status(201).json({
      message: "Community created successfully!",
      community,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create community error:", error);
    return errorHandler(res, "Failed to create community", 500);
  }
};

export const addMembers = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { communityId, members = [] } = req.body;
    const profileId = req.profile!.id;

    if (!communityId || !Array.isArray(members) || members.length === 0) {
      await transaction.rollback();
      return errorHandler(res, "Sorry community ID and members are required", 400);
    }

    const admin = await Member.findOne({
      where: { targetId: communityId , profileId, role: "admin", memberType:"community" },
    });

    if (!admin) {
      await transaction.rollback();
      return errorHandler(res, "Unauthorized. Only admins can add members", 403);
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
  } catch (error) {
    await transaction.rollback();
    console.error("Add members error:", error);
    return errorHandler(res, "Failed to add members", 500);
  }
};

export const fetchMembers = async (req: Request, res: Response) => {
  try {
    const { 
      communityId, 
      search = "", 
      page = "1", 
      limit = "20" 
    } = req.query;

    
    if (!communityId) {
      return errorHandler(res, "CommunityId is required", 400);
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

    
    return res.status(200).json({
      total: count,
      currentPage: pageNum,
      totalPages: Math.ceil(count / limitNum),
      members,
    });
  } catch (error) {
    console.error("❌ Fetch members error:", error);
    return errorHandler(res, "Failed to fetch members", 500);
  }
};