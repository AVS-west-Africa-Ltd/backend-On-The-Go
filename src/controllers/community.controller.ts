import { errorHandler, successHandler } from "../handlers/responseHandlers";
import { Request, Response } from "express";
import { CommunityService } from "../services/community.service";

export const create = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const photo = req.file?.location || null;

    const community = await CommunityService.create(req.body, userId, profileId, photo);

    return successHandler(res, "Community created successfully!", 201, { community });
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

    return successHandler(res, "Members added successfully!", 200);
  } catch (error: any) {
    return errorHandler(res, error.message || "Failed to add members", error.status || 500);
  }
};

export const fetchMembers = async (req: Request, res: Response) => {
  try {
    const result = await CommunityService.fetchMembers(req.query);
    return successHandler(res, "Members fetched successfully", 200, result);
  } catch (error: any) {
    return errorHandler(res, error.message || "Failed to fetch members", error.status || 500);
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const profileId = req.profile!.id;
    const photo = req.file?.location || null;

    const community = await CommunityService.update(communityId, req.body, profileId, photo);

    return successHandler(res, "Community updated successfully!", 200, { community });
  } catch (error: any) {
    return errorHandler(res, error.message || "Failed to update community", error.status || 500);
  }
};

export const fetchCommunity = async (req: Request, res: Response) => {
  try {
    const result = await CommunityService.fetchCommunity(req.query);
    return successHandler(res, "Communities fetched successfully", 200, result);
  } catch (error: any) {
    return errorHandler(res, error.message || "Failed to fetch communities", error.status || 500);
  }
};

export const fetchCommunityById = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const result = await CommunityService.fetchCommunityById(communityId);
    return successHandler(res, "Community fetched successfully", 200, { community: result });
  } catch (error: any) {
    return errorHandler(res, error.message || "Failed to fetch community", error.status || 500);
  }
};

export const deleteCommunity = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const profileId = req.profile!.id;

    await CommunityService.delete(communityId, profileId);

    return successHandler(res, "Community deleted successfully!", 200);
  } catch (error: any) {
    return errorHandler(res, error.message || "Failed to delete community", error.status || 500);
  }
};