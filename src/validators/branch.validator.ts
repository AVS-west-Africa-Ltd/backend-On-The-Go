import Joi from "joi";

// HH:mm 24-hour format validator
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const daySchema = Joi.object({
  open: Joi.string().pattern(TIME_PATTERN).allow(null),
  close: Joi.string().pattern(TIME_PATTERN).allow(null),
}).required();

export const createBranchSchema = Joi.object({
  name: Joi.string().required(),
  fullAddress: Joi.string().allow("", null),
  description: Joi.string().required(),
  streetAddress: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
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
  staff: Joi.array().items(
    Joi.object({
      fullName: Joi.string().required(),
      email: Joi.string().email().required(),
      role: Joi.string().required(),
    })
  )
  .optional()
  .default([]),
});

export const addWorkingHoursSchema = Joi.object({
    working_hours: Joi.object({
    monday: daySchema,
    tuesday: daySchema,
    wednesday: daySchema,
    thursday: daySchema,
    friday: daySchema,
    saturday: daySchema,
    sunday: daySchema,
  }).required(),
})

