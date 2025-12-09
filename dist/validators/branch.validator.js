"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addWorkingHoursSchema = exports.createBranchSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// HH:mm 24-hour format validator
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const daySchema = joi_1.default.object({
    open: joi_1.default.string().pattern(TIME_PATTERN).allow(null),
    close: joi_1.default.string().pattern(TIME_PATTERN).allow(null),
}).required();
exports.createBranchSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    fullAddress: joi_1.default.string().allow("", null),
    description: joi_1.default.string().required(),
    streetAddress: joi_1.default.string().required(),
    state: joi_1.default.string().required(),
    country: joi_1.default.string().required(),
    city: joi_1.default.string().required(),
    isHQ: joi_1.default.boolean().default(false),
    working_hours: joi_1.default.object({
        monday: daySchema,
        tuesday: daySchema,
        wednesday: daySchema,
        thursday: daySchema,
        friday: daySchema,
        saturday: daySchema,
        sunday: daySchema,
    }).required(),
    amenities: joi_1.default.array().items(joi_1.default.string()).default([]),
    staff: joi_1.default.array().items(joi_1.default.object({
        fullName: joi_1.default.string().required(),
        email: joi_1.default.string().email().required(),
        role: joi_1.default.string().required(),
    }))
        .optional()
        .default([]),
});
exports.addWorkingHoursSchema = joi_1.default.object({
    working_hours: joi_1.default.object({
        monday: daySchema,
        tuesday: daySchema,
        wednesday: daySchema,
        thursday: daySchema,
        friday: daySchema,
        saturday: daySchema,
        sunday: daySchema,
    }).required(),
});
