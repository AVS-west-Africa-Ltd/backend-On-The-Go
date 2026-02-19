import { IPaginatedResponse } from "./common.interface";
import { RewardTriggerType, VoucherStatus, VoucherType } from "../models/types/rewardRules.types";

export interface IGetRulesParams {
    businessId: number;
    branchId?: number;
    cursor?: string;
    limit?: number;
}

export interface IGetUserVouchersParams {
    userId: number;
    branchId?: number;
    cursor?: string;
    limit?: number;
}

export interface IGetBranchVouchersParams {
    branchId: number;
    status?: VoucherStatus;
    search?: string;
    cursor?: string;
    limit?: number;
}

export interface IRedeemVoucherContext {
    orderSubtotal: number;
    items: { productId: number; quantity: number }[];
    appliedVoucherIds?: number[];
}

export interface ITrackProgressParams {
    userId: number;
    businessId: number;
    triggerType: RewardTriggerType;
    branchId?: number;
}

export interface IRewardRulesResponse extends IPaginatedResponse {
    rules: any[]; // Will refine once I check model attributes
}

export interface IVoucherListResponse extends IPaginatedResponse {
    vouchers: any[];
}

export interface ICreateRewardRule {
    businessId: number;
    branchId?: number | null;
    name?: string;
    triggerType: RewardTriggerType;
    threshold: number;
    voucherType: VoucherType;
    value: number;
    validityDays?: string[];
    expiryHours?: number;
    maxPerUser?: number;
    description?: string;
    productId?: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    isStackable?: boolean;
}

export interface IManualIssueVoucher {
    userId: number;
    businessId: number;
    branchId?: number;
    voucherType: VoucherType;
    value: number;
    validityDays?: string[];
    expiryHours: number;
    description?: string;
    productId?: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    isStackable?: boolean;
}
