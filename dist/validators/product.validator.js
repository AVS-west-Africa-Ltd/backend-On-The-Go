"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = exports.updateProductSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.updateProductSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).optional(),
    description: joi_1.default.string().min(2).optional(),
    price: joi_1.default.number().positive().optional(),
    branchAmenityId: joi_1.default.string().optional(),
    meta: joi_1.default.object().optional(),
    media: joi_1.default.object({
        keep: joi_1.default.array().items(joi_1.default.string()).default([]),
        remove: joi_1.default.array().items(joi_1.default.string()).default([]),
        add: joi_1.default.any() // or Joi.array().items(Joi.any())
    }).optional()
});
exports.createProductSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().min(5).max(2000).required(),
    status: joi_1.default.string().valid('available', 'not available').optional(),
    price: joi_1.default.number().positive().required(),
    branchAmenityId: joi_1.default.string().uuid().required(),
    meta: joi_1.default.any().optional(),
});
