"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.createProfileSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createProfileSchema = joi_1.default.object({
    userName: joi_1.default.string().min(2).max(50).required(),
    profileType: joi_1.default.string().valid('personal', 'business').default('personal'),
    // Conditional validation: specific fields required if type is business
    streetAddress: joi_1.default.when('profileType', {
        is: 'business',
        then: joi_1.default.string().required(),
        otherwise: joi_1.default.string().optional().allow('')
    }),
    fullAddress: joi_1.default.string().when("profileType", {
        is: "business",
        then: joi_1.default.string().optional().allow(""),
        otherwise: joi_1.default.forbidden(),
    }),
    city: joi_1.default.when('profileType', {
        is: 'business',
        then: joi_1.default.string().required(),
        otherwise: joi_1.default.string().optional().allow('')
    }),
    state: joi_1.default.when('profileType', {
        is: 'business',
        then: joi_1.default.string().required(),
        otherwise: joi_1.default.string().optional().allow('')
    }),
    country: joi_1.default.when('profileType', {
        is: 'business',
        then: joi_1.default.string().required(),
        otherwise: joi_1.default.string().optional().allow('')
    }),
    cacNo: joi_1.default.when('profileType', {
        is: 'business',
        then: joi_1.default.string().required(),
        otherwise: joi_1.default.forbidden(),
    }),
    businessCategory: joi_1.default.when('profileType', {
        is: 'business',
        then: joi_1.default.string().valid('sme', 'large_enterprise').required(),
        otherwise: joi_1.default.forbidden(),
    }),
    // PERSONAL-only fields
    profession: joi_1.default.string().when("profileType", {
        is: "personal",
        then: joi_1.default.required(),
        otherwise: joi_1.default.forbidden(),
    }),
    skills: joi_1.default.array().items(joi_1.default.string()).when("profileType", {
        is: "personal",
        then: joi_1.default.array().items(joi_1.default.string()).required(),
        otherwise: joi_1.default.forbidden(),
    }),
    gender: joi_1.default.string().when("profileType", {
        is: "personal",
        then: joi_1.default.required(),
        otherwise: joi_1.default.forbidden(),
    }),
    bio: joi_1.default.string().when("profileType", {
        is: "personal",
        then: joi_1.default.required(),
        otherwise: joi_1.default.allow(null).default(""),
    }),
    interests: joi_1.default.string().when("profileType", {
        is: "personal",
        then: joi_1.default.array().items(joi_1.default.string()).optional(),
        otherwise: joi_1.default.allow(null).default(""),
    }),
    placesVisited: joi_1.default.string().when("profileType", {
        is: "personal",
        then: joi_1.default.array().items(joi_1.default.string()).optional(),
        otherwise: joi_1.default.allow(null).default(""),
    }),
    geoLocation: joi_1.default.array().items(joi_1.default.number()).length(2).optional(),
    // Arrays and Objects
    // skills: Joi.alternatives().try(
    //   Joi.array().items(Joi.string()), 
    //   Joi.string()
    // ),
    // interests: Joi.array().items(Joi.string()).optional(),
    // Common fields
    // gender: Joi.string().valid('male', 'female', 'other').optional().allow(''),
});
exports.updateProfileSchema = joi_1.default.object({
    bio: joi_1.default.string().max(500).optional(),
    website: joi_1.default.string().uri().optional(),
    businessType: joi_1.default.string().optional(),
    // Add other update fields...
});
