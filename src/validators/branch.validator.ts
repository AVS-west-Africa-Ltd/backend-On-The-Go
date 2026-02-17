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
      // fullName: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      role: Joi.string().required(),
    })
  )
    .optional()
    .default([]),

  geoLocation: Joi.array().items(Joi.number()).length(2).optional(),
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

export const inviteStaffSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().required(),
})

export const getBranchCustomersSchema = Joi.object({
  cursor: Joi.string().optional(),
  limit: Joi.number().integer().optional(),
  search: Joi.string().optional(),
  branchId: Joi.number().integer().positive().optional(),
  from: Joi.string().isoDate().optional(),
  to: Joi.string().isoDate().optional(),
});
