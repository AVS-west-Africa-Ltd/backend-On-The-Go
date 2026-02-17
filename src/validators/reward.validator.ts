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
    isActive: Joi.boolean().optional(),
});

// getRewardRulesSchema removed as businessId is now session-derived

export const getRewardRulesQuerySchema = Joi.object({
    branchId: Joi.number().integer().optional(),
});

export const getMyVouchersQuerySchema = Joi.object({
    businessId: Joi.number().integer().optional(),
});

export const redeemVoucherSchema = Joi.object({
    voucherId: Joi.number().integer().required(),
});

export const getBranchVouchersSchema = Joi.object({
    branchId: Joi.number().integer().optional(),
});

export const getBranchVouchersQuerySchema = Joi.object({
    status: Joi.string().valid(...Object.values(VoucherStatus)).optional(),
    search: Joi.string().optional(),
});

export const manualIssueVoucherSchema = Joi.object({
    userId: Joi.number().integer().required(),
    voucherType: Joi.string().valid(...Object.values(VoucherType)).required(),
    value: Joi.number().min(0).required(),
    validityDays: Joi.array().items(Joi.string()).optional(),
    expiryHours: Joi.number().integer().min(1).required(),
    branchId: Joi.number().integer().optional(),
});
