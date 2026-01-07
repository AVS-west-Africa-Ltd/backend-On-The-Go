import Joi from "joi";

export const createCommunitySchema = Joi.object({
    name: Joi.string().max(150).required(),
    description: Joi.string().allow("", null),
    type: Joi.string().valid("public", "private").default("public"),
    visibility: Joi.string().valid("public", "invite_only").default("public"),
});

export const addMembersSchema = Joi.object({
    communityId: Joi.string().uuid().required(),
    members: Joi.array().items(Joi.number().integer()).min(1).required(),
});

export const fetchMembersSchema = Joi.object({
    communityId: Joi.string().uuid().required(),
    search: Joi.string().allow("", null),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(20),
});

export const updateCommunitySchema = Joi.object({
    name: Joi.string().max(150),
    description: Joi.string().allow("", null),
    type: Joi.string().valid("public", "private"),
    visibility: Joi.string().valid("public", "invite_only"),
});
