import Joi from "joi";

export const createPostSchema = Joi.object({
    body: Joi.string().required(),
    postType: Joi.string().valid("normal", "review").default("normal"),
    target: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    amenities: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    branchId: Joi.number().optional(),
});

export const fetchPostsSchema = Joi.object({
    limit: Joi.number().integer().min(1).default(20),
    offset: Joi.number().integer().min(0).default(0),
    search: Joi.string().optional().allow(""),
    type: Joi.string().valid("normal", "review").optional(),
});

export const searchBusinessesSchema = Joi.object({
    search: Joi.string().optional().allow(""),
    offset: Joi.number().integer().min(0).default(0),
    location: Joi.string().optional(),
    amenity: Joi.string().optional(),
    businessType: Joi.string().optional(),
    type: Joi.string().optional(),
});

export const makeCommentSchema = Joi.object({
    postId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    body: Joi.string().required(),
    parentId: Joi.alternatives().try(Joi.string(), Joi.number()).optional().allow(null),
});

export const toggleReactionSchema = Joi.object({
    targetId: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    targetType: Joi.string().valid("post", "comment").required(),
    type: Joi.string().valid("like", "dislike", "love").required(),
});

export const followProfileSchema = Joi.object({
    friendId: Joi.number().integer().required(),
});

export const createChatSchema = Joi.object({
    type: Joi.string().valid("private", "group").required(),
    name: Joi.string().optional().allow(null, ""),
    profileIds: Joi.array().items(Joi.number().integer()).optional(),
});

export const joinCommunitySchema = Joi.object({
    communityId: Joi.string().uuid().required(),
});

export const leaveCommunitySchema = Joi.object({
    communityId: Joi.string().uuid().required(),
});

export const fetchCommunitiesSchema = Joi.object({
    limit: Joi.number().integer().min(1).default(20),
    offset: Joi.number().integer().min(0).default(0),
    search: Joi.string().optional().allow(""),
});
