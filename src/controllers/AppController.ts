import { Request, Response } from "express";
import { AppService } from "../services/app.service";
import { errorHandler } from "../handlers/responseHandlers";
import { PostType } from "../models/types/post.types";

export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const branchIdFromReq = req.branch;

    let media: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      media = req.files.map((file: any) => file.location || file.path);
    }

    const post = await AppService.createPost(req.body, userId, profileId, branchIdFromReq, media);
    return res.status(201).json({ post, message: "Post created successfully!" });
  } catch (error: any) {
    console.error("Error creating post:", error);
    // Use error message if available, otherwise generic
    return res.status(400).json({ message: error.message || "Sorry, something went wrong!" });
  }
};

export const fetchPosts = async (req: Request, res: Response) => {
  try {
    const posts = await AppService.fetchPosts(req.query);
    return res.status(200).json({
      posts,
      message: "Posts fetched successfully",
    });
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    return res.status(400).json({ message: error.message || "Failed to fetch posts" });
  }
};

export const searchBusinesses = async (req: Request, res: Response) => {
  try {
    const branches = await AppService.searchBusinesses(req.query);
    res.status(200).json({
      branches,
      message: "Branches with profiles fetched successfully",
    });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({
      message: error.message || "Something went wrong while searching profiles",
    });
  }
};

export const viewBusiness = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const branch = await AppService.viewBusiness(branchId);
    return res.status(200).json({
      branch,
      message: "Business fetched successfully!",
    });
  } catch (error: any) {
    console.error(error);
    if (error.message === "Business not found") {
      return res.status(404).json({ message: "Business not found" });
    }
    return res.status(400).json({
      message: error.message || "Something went wrong while fetching business details",
    });
  }
};

export const makeComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const comment = await AppService.makeComment(req.body, userId, profileId);
    return res.status(201).json({ comment, message: "Comment created successfully" });
  } catch (error: any) {
    console.error("Create comment error:", error);
    res.status(500).json({ message: error.message || "Failed to create comment" });
  }
};

export const toggleReaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const profileId = req.profile!.id;
    const result = await AppService.toggleReaction(req.body, userId, profileId);
    return res.status(200).json(result);
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({
      message: error.message || "Something went wrong! toggling reaction",
    });
  }
};

export const followProfile = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.body;
    const userId = req.user;
    const profileId = req.profile!.id;

    const friend = await AppService.followProfile(friendId, userId, profileId);

    return res.status(201).json({
      message: "Followed successfully",
      friend,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({
      message: error.message || "Something went wrong while following profile",
    });
  }
};

export const createChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user
    const creatorId = req.profile?.id;
    if (!creatorId) return res.status(400).json({ message: "creatorId is required" });

    const result = await AppService.createChat(req.body, userId, creatorId);

    if (result.isExisting) {
      return res.status(200).json({
        chat: result.chat,
        message: "Existing private chat found",
      });
    }

    return res.status(201).json({
      chat: result.chat,
      message: "Chat successfully opened",
    });
  } catch (error: any) {
    console.error("❌ Chat creation failed:", error);
    return res.status(400).json({ message: error.message });
  }
};

export const fetchChats = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile?.id;
    if (!profileId) return res.status(400).json({ message: "Profile ID required" }); // Just in case, though middleware likely handles it.

    const chats = await AppService.fetchChats(profileId, req.query);

    if (!chats.length) {
      return res.status(200).json({ chats: [], message: "No chats found" });
    }

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
  try {
    const profileId = req.profile!.id;
    const { communityId } = req.body;

    // Check validation in service? Service took communityId.

    const result = await AppService.joinCommunity(communityId, profileId);

    if (!result.created) {
      return res.status(200).json({ message: "You are already a member" });
    }

    return res.status(201).json({
      message: "Successfully joined the community!",
      member: result.member,
    });
  } catch (error: any) {
    console.error("Join community error:", error);
    if (error.message === "Community not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes("invite-only")) {
      return res.status(403).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || "Failed to join community" });
  }
};





