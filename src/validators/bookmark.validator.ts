import Joi from "joi";

export const toggleBookmarkSchema = Joi.object({
    postId: Joi.number().integer().positive().required(),
});

export const getBookmarksSchema = Joi.object({
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(50).default(10),
});
