import { errorHandler } from "../handlers/responseHandlers";
import { Request, Response } from "express";
import { CommunityService } from "../services/community.service";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const photo = req.file?.location || null;

    const community = await CommunityService.create(req.body, userId, profileId, photo);

    return res.status(201).json({
      message: "Community created successfully!",
      community,
    });
  } catch (error: any) {
    console.error("Create community error:", error);
    if (error.message === "Community name is required") {
      return errorHandler(res, error.message, 400);
    }
    return errorHandler(res, "Failed to create community", 500);
  }
};

export const addMembers = async (req: Request, res: Response) => {
  try {
    const { communityId, members = [] } = req.body;
    const profileId = req.profile!.id;

    await CommunityService.addMembers(communityId, members, profileId);

    return res.status(200).json({ message: "Members added successfully!" });
  } catch (error: any) {
    console.error("Add members error:", error);
    if (error.message.includes("required") || error.message.includes("Unauthorized")) {
      return errorHandler(res, error.message, error.message.includes("Unauthorized") ? 403 : 400);
    }
    return errorHandler(res, "Failed to add members", 500);
  }
};

export const fetchMembers = async (req: Request, res: Response) => {
  try {
    const result = await CommunityService.fetchMembers(req.query);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ Fetch members error:", error);
    if (error.message === "CommunityId is required") {
      return errorHandler(res, error.message, 400);
    }
    return errorHandler(res, "Failed to fetch members", 500);
  }
};