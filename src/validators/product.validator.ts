import Joi from "joi";

export const updateProductSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  description: Joi.string().min(2).optional(),
  price: Joi.number().positive().optional(),
  branchAmenityId: Joi.string().optional(),
  meta: Joi.object().optional(),

  media: Joi.object({
    keep: Joi.array().items(Joi.string()).default([]),
    remove: Joi.array().items(Joi.string()).default([]),

    add: Joi.any() // or Joi.array().items(Joi.any())
  }).optional()
});

export const createProductSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(5).max(2000).required(),
  status: Joi.string().valid('available', 'not available').optional(),
  price: Joi.number().positive().required(),
  branchAmenityId: Joi.string().uuid().required(),
  branchId: Joi.number().integer().optional(),
  meta: Joi.any().optional(),
});

export const filterBranchProductsSchema = Joi.object({
  // Convert "123" -> 123
  branchId: Joi.number().integer().required(),

  // Validate UUID format
  amenityId: Joi.string().uuid().optional(),

  // Convert "20" -> 20. Default to 20 if missing.
  limit: Joi.number().integer().min(1).max(100).default(20),

  cursor: Joi.string().optional(),

  // Convert "true"/"false" strings to boolean. Default false.
  featured: Joi.boolean().default(false),
});

