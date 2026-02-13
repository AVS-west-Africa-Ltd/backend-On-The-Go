import { Request, Response } from "express";
import { Friend } from "../models/friend.model";
import { Profile } from "../models/profile.model";
import { Op } from "sequelize";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { ProfileType } from "../models/types/profile.types";

export const followUser = async (req: Request, res: Response) => {
    try {
        const { profileId } = req.params; // ID of the user to follow (profileId or userId? Friend model uses ownerId/friendId which are Profile IDs likely)
        const myProfileId = req.profile!.id;

        if (parseInt(profileId) === myProfileId) {
            return errorHandler(res, "You cannot follow yourself.", 400);
        }

        const [friendship, created] = await Friend.findOrCreate({
            where: {
                ownerId: myProfileId,
                friendId: profileId
            },
            defaults: {
                userId: req.user!,
                ownerId: myProfileId,
                friendId: parseInt(profileId),
                status: "accepted"
            }
        });

        if (!created && friendship) {
            return errorHandler(res, "You are already following this user.", 400);
        }

        return successHandler(res, "User followed successfully.", 200, friendship);
    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
    }
};

export const unfollowUser = async (req: Request, res: Response) => {
    try {
        const { profileId } = req.params;
        const myProfileId = req.profile!.id;

        const deleted = await Friend.destroy({
            where: {
                ownerId: myProfileId,
                friendId: parseInt(profileId)
            }
        });

        if (!deleted) {
            return errorHandler(res, "You are not following this user.", 404);
        }

        return successHandler(res, "User unfollowed successfully.", 200);
    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
    }
};

export const getFollowers = async (req: Request, res: Response) => {
    try {
        const profileId = req.params.userId || req.profile!.id;

        const followers = await Friend.findAll({
            where: { friendId: profileId },
            include: [{
                model: Profile,
                as: "following",
                attributes: ["id", "userName", "picture", "bio"]
            }]
        });

        return successHandler(res, "Followers retrieved successfully", 200, followers.map(f => f.following));
    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
    }
};

export const getFollowing = async (req: Request, res: Response) => {
    try {
        const profileId = req.params.userId || req.profile!.id;

        const following = await Friend.findAll({
            where: { ownerId: profileId },
            include: [{
                model: Profile,
                as: "follower",
                attributes: ["id", "userName", "picture", "bio"]
            }]
        });

        return successHandler(res, "Following retrieved successfully", 200, following.map(f => f.follower));
    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
    }
};

export const getFollowSuggestions = async (req: Request, res: Response) => {
    try {
        const myProfileId = req.profile!.id;

        const alreadyFollowing = await Friend.findAll({
            where: { ownerId: myProfileId },
            attributes: ['friendId']
        });

        const excludeIds = alreadyFollowing.map(f => f.friendId);
        excludeIds.push(myProfileId);

        const suggestions = await Profile.findAll({
            where: {
                id: { [Op.notIn]: excludeIds },
                profileType: ProfileType.PERSONAL
            },
            limit: 10,
            attributes: ["id", "userName", "picture", "bio"]
        });

        return successHandler(res, "Follow suggestions fetched", 200, suggestions);

    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
    }
};
