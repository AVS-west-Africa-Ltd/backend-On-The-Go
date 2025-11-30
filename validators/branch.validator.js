const Joi = require("joi");

// HH:mm 24-hour format validator
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const daySchema = Joi.object({
  open: Joi.string().pattern(TIME_PATTERN).allow(null),
  close: Joi.string().pattern(TIME_PATTERN).allow(null),
}).required();

exports.createBranchSchema = Joi.object({
  name: Joi.string().required(),
  fullAddress: Joi.string().required(),
  description: Joi.string().allow("", null),
  streetAddress: Joi.string().allow("", null),
  state: Joi.string().allow("", null),
  country: Joi.string().allow("", null),
  city: Joi.string().allow("", null),
  isHQ: Joi.boolean().default(false),

  working_hours: Joi.object({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
  }).required(),

  amenities: Joi.array().items(Joi.string()).default([]),
});
