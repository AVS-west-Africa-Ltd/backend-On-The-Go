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
  meta: Joi.any().optional(),
});

