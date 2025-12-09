import Joi from 'joi';

export const createProfileSchema = Joi.object({
  userName: Joi.string().min(2).max(50).required(),
  profileType: Joi.string().valid('personal', 'business').default('personal'),
  
  // Conditional validation: specific fields required if type is business
  streetAddress: Joi.when('profileType', {
    is: 'business',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('')
  }),

    fullAddress: Joi.string().when("profileType", {
    is: "business",
    then: Joi.string().optional().allow(""),
    otherwise: Joi.forbidden(),
  }),

  city: Joi.when('profileType', {
    is: 'business',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('')
  }),
  state: Joi.when('profileType', {
    is: 'business',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('')
  }),
  country: Joi.when('profileType', {
    is: 'business',
    then: Joi.string().required(),
    otherwise: Joi.string().optional().allow('')
  }),
  cacNo: Joi.when('profileType', {
    is: 'business',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  businessCategory: Joi.when('profileType', {
    is: 'business',
    then: Joi.string().valid('sme', 'large_enterprise').required(),
    otherwise: Joi.forbidden(),
  }),


   // PERSONAL-only fields
  profession: Joi.string().when("profileType", {
    is: "personal",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  skills: Joi.array().items(Joi.string()).when("profileType", {
    is: "personal",
    then: Joi.array().items(Joi.string()).required(),
    otherwise: Joi.forbidden(),
  }),

  gender: Joi.string().when("profileType", {
    is: "personal",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  bio: Joi.string().when("profileType", {
    is: "personal",
    then: Joi.required(),
    otherwise: Joi.allow(null).default(""),
  }),

  interests: Joi.string().when("profileType", {
    is: "personal",
    then: Joi.array().items(Joi.string()).optional(),
    otherwise: Joi.allow(null).default(""),
  }),

  placesVisited: Joi.string().when("profileType", {
    is: "personal",
    then: Joi.array().items(Joi.string()).optional(),
    otherwise: Joi.allow(null).default(""),
  }),

  geoLocation: Joi.array().items(Joi.number()).length(2).optional(),

  // Arrays and Objects
  // skills: Joi.alternatives().try(
  //   Joi.array().items(Joi.string()), 
  //   Joi.string()
  // ),
  // interests: Joi.array().items(Joi.string()).optional(),
  
  // Common fields
  // gender: Joi.string().valid('male', 'female', 'other').optional().allow(''),
});

export const updateProfileSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  website: Joi.string().uri().optional(),
  businessType: Joi.string().optional(),
  // Add other update fields...
});