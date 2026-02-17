import Joi from 'joi';

export const discoverSchema = Joi.object({
    query: Joi.string().optional().allow(''),
    near_me: Joi.string().valid('true', 'false').optional(),
    lat: Joi.string().optional(),
    lng: Joi.string().optional(),
    sort: Joi.string().valid('distance', 'latest').optional(),
    type: Joi.string().valid('personal', 'business').optional(),
    partners_only: Joi.string().valid('true', 'false').optional(),
    amenity: Joi.string().optional().allow(''),
    radius: Joi.number().optional().default(10000)
});

export const globalSearchSchema = Joi.object({
    query: Joi.string().required()
});
