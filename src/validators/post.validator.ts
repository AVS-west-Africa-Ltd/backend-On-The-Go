import Joi from "joi";
import { PostType, PostTargetType } from "../models/types/post.types";

export const createPostSchema = Joi.object({
    body: Joi.string().required().messages({
        "string.empty": "Post body cannot be empty",
    }),
    postType: Joi.string()
        .valid(...Object.values(PostType))
        .required()
        .messages({
            "any.only": `Invalid post type. Type can only be one of: ${Object.values(PostType).join(", ")}`,
        }),
    target: Joi.number().required().messages({
        "number.base": "Invalid target for the post",
    }),
    branchId: Joi.number()
        .when("postType", {
            is: PostType.REVIEW,
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            "any.required": "Branch ID is required when creating a review post",
        }),
    amenities: Joi.alternatives()
        .try(Joi.object().pattern(Joi.string(), Joi.number()), Joi.string())
        .allow(null, ""),
    targetType: Joi.string()
        .valid(...Object.values(PostTargetType))
        .optional()
        .messages({
            "any.only": `Invalid target type. Type can only be one of: ${Object.values(PostTargetType).join(", ")}`,
        }),
});
