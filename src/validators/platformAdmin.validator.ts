import Joi from "joi";

export const paginationSchema = {
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(10),
};

export const getAllUsersSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    isVerified: Joi.boolean().optional(),
});

export const getAllBusinessesSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    businessCategory: Joi.string().valid("sme", "large_enterprise").optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
});

export const getAllBranchesSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    businessId: Joi.number().integer().optional(),
    state: Joi.string().optional(),
    city: Joi.string().optional(),
});

export const getAllProductsSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
    status: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
});

export const getAllOrdersSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
    status: Joi.string().optional(),
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
});

export const getAllReviewsSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    profileId: Joi.number().integer().optional(),
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
    rating: Joi.number().min(1).max(5).optional(),
});

export const getAllPostsSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    profileId: Joi.number().integer().optional(),
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
});

export const getAllCommunitiesSchema = Joi.object({
    ...paginationSchema,
    search: Joi.string().optional(),
    profileId: Joi.number().integer().optional(),
    type: Joi.string().valid("public", "private").optional(),
});

export const getAllInsightsSchema = Joi.object({
    ...paginationSchema,
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
    metric: Joi.string().optional(),
});

export const getAllRewardsSchema = Joi.object({
    ...paginationSchema,
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
});

export const getAllVouchersSchema = Joi.object({
    ...paginationSchema,
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
    status: Joi.string().optional(),
});

export const getAllWifiProfilesSchema = Joi.object({
    ...paginationSchema,
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
});

export const getAllWifiTicketsSchema = Joi.object({
    ...paginationSchema,
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
});

export const getAllWifiVouchersSchema = Joi.object({
    ...paginationSchema,
    businessId: Joi.number().integer().optional(),
    branchId: Joi.number().integer().optional(),
});

export const getAllSettingsSchema = Joi.object({
    ...paginationSchema,
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
});
