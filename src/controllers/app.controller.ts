import { Request, Response } from "express";
import { AppService } from "../services/app.service";
import { errorHandler, successHandler } from "../handlers/responseHandlers";
import { AppBranchService } from "../services/app/branches.app.service";

export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    let media: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      media = req.files.map((file: any) => file.location || file.path);
    }

    const { body, postType, target, amenities, branchId, targetType } = req.body;

    const payload = {
      body,
      postType,
      target,
      amenities,
      branchId: branchId || req.branch,
      targetType,
      media
    };

    const post = await AppService.createPost(payload, userId, profileId);
    return successHandler(res, "Post created successfully", 201, post);
  } catch (error: any) {
    console.error("Error creating post:", error);
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500, error);
  }
};

export const fetchPosts = async (req: Request, res: Response) => {
  try {
    const posts = await AppService.fetchPosts(req.query);
    return successHandler(res, "Posts fetched successfully", 200, posts);
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return errorHandler(res, error.message || "Failed to fetch posts", error.status || 500, error);
  }
};

export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const branches = await AppService.searchBusinesses(req.query);
    return successHandler(res, "Branches with profiles fetched successfully", 200, branches);
  } catch (error: any) {
    console.error(error);
    return errorHandler(res, error.message || "Something went wrong while searching profiles", error.status || 500, error);
  }
};

export const viewBusiness = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const branch = await AppService.viewBusiness(branchId);
    return successHandler(res, "Business fetched successfully!", 200, branch);
  } catch (error: any) {
    console.error(error);
    return errorHandler(res, error.message || "Something went wrong while fetching business details", error.status || 500, error);
  }
};

export const makeComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const comment = await AppService.makeComment(req.body, userId, profileId);
    return successHandler(res, "Comment created successfully", 201, comment);
  } catch (error: any) {
    console.error("Create comment error:", error);
    return errorHandler(res, error.message || "Failed to create comment", error.status || 500, error);
  }
};

export const toggleReaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const result = await AppService.toggleReaction(req.body, userId, profileId);
    return successHandler(res, "Reaction toggled successfully", 200, result);
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500, error);
  }
};

export const followProfile = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.body;
    const userId = req.user;
    const profileId = req.profile!.id;

    const friend = await AppService.followProfile(friendId, userId, profileId);

    return successHandler(res, "Followed successfully", 201, friend);
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500, error);
  }
};

export const createChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user
    const creatorId = req.profile?.id;
    if (!creatorId) return errorHandler(res, "creatorId is required", 400, null);

    const result = await AppService.createChat(req.body, userId, creatorId);

    if (result.isExisting) {
      return successHandler(res, "Existing private chat found", 200, result.chat);
    }

    return successHandler(res, "Chat successfully opened", 201, result.chat);
  } catch (error: any) {
    console.error("❌ Chat creation failed:", error);
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500, error);
  }
};

export const fetchChats = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile?.id;
    if (!profileId) return errorHandler(res, "Profile ID required", 400, null);

    const chats = await AppService.fetchChats(profileId, req.query);

    if (chats.length === 0) {
      return successHandler(res, "No chats found", 200, chats);
    }

    return successHandler(res, "Chats fetched successfully!", 200, chats);

  } catch (err: any) {
    console.error("❌ fetchChats error:", err);
    return errorHandler(res, err.message || "Something went wrong!", err.status || 500, err);
  }
};

export const joinCommunity = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const { communityId } = req.body;

    const result = await AppService.joinCommunity(parseInt(communityId, 10), profileId);

    if (!result.created) {
      return successHandler(res, "You are already a member", 200);
    }

    return successHandler(res, "Successfully joined the community!", 201, result.member);
  } catch (error: any) {
    console.error("Join community error:", error);
    return errorHandler(res, error.message || "Failed to join community", error.status || 500, error);
  }
};

export const leaveCommunity = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const { communityId } = req.body;

    const result = await AppService.leaveCommunity(parseInt(communityId, 10), profileId);

    return successHandler(res, "Successfully left community", 200, result);
  } catch (error: any) {
    console.error("Leave community error:", error);
    return errorHandler(res, error.message || "Failed to leave community", error.status || 500, error);
  }

};

export const fetchCommunities = async (req: Request, res: Response) => {
  try {
    const result = await AppService.fetchCommunities(req.query);

    return successHandler(res, "Communities fetched successfully!", 200, result);
  } catch (error: any) {
    console.error("Fetch communities error:", error);
    return errorHandler(res, error.message || "Failed to fetch communities", error.status || 500, error);
  }
};

export const getBranchForUser = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;

    const branch = await AppBranchService.getBranchById(parseInt(branchId, 10));

    if (!branch) {
      return errorHandler(res, "Branch not found", 404, null);
    }

    return successHandler(res, "Branch fetched successfully!", 200, branch);
  } catch (error: any) {
    console.error("Get branch error:", error);
    return errorHandler(res, error.message || "Failed to get branch", error.status || 500, error);
  }
};





