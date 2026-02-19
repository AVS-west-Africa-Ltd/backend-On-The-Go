import Joi from "joi";
import { RewardTriggerType, VoucherType, VoucherStatus } from "../models/types/rewardRules.types";

export const createRewardRuleSchema = Joi.object({
    triggerType: Joi.string().valid(...Object.values(RewardTriggerType)).required(),
    threshold: Joi.number().integer().min(1).required(),
    voucherType: Joi.string().valid(...Object.values(VoucherType)).required(),
    value: Joi.number().min(0).required(),
    name: Joi.string().optional().allow(null),
    branchId: Joi.number().integer().optional().allow(null),
    validityDays: Joi.array().items(Joi.string()).optional(),
    expiryHours: Joi.number().integer().min(1).optional(),
    maxPerUser: Joi.number().integer().min(1).optional(),
    productId: Joi.number().integer().optional(),
    minOrderAmount: Joi.number().min(0).optional(),
    maxDiscountAmount: Joi.number().min(0).optional(),
    isStackable: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
});

// getRewardRulesSchema removed as businessId is now session-derived

export const getRewardRulesQuerySchema = Joi.object({
    branchId: Joi.number().integer().optional(),
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
});

export const getMyVouchersQuerySchema = Joi.object({
    branchId: Joi.number().integer().optional(),
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
});

export const redeemVoucherSchema = Joi.object({
    voucherId: Joi.number().integer().required(),
    orderSubtotal: Joi.number().min(0).optional(),
    items: Joi.array().items(Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required()
    })).optional(),
    appliedVoucherIds: Joi.array().items(Joi.number().integer()).optional(),
});

export const getBranchVouchersSchema = Joi.object({
    branchId: Joi.number().integer().optional(),
});

export const getBranchVouchersQuerySchema = Joi.object({
    status: Joi.string().valid(...Object.values(VoucherStatus)).optional(),
    search: Joi.string().optional(),
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
});

export const manualIssueVoucherSchema = Joi.object({
    userId: Joi.number().integer().required(),
    voucherType: Joi.string().valid(...Object.values(VoucherType)).required(),
    value: Joi.number().min(0).required(),
    validityDays: Joi.array().items(Joi.string()).optional(),
    expiryHours: Joi.number().integer().min(1).required(),
    productId: Joi.number().integer().optional(),
    minOrderAmount: Joi.number().min(0).optional(),
    maxDiscountAmount: Joi.number().min(0).optional(),
    isStackable: Joi.boolean().optional(),
    branchId: Joi.number().integer().optional(),
});
