export enum RewardTriggerType {
    REVIEW = "REVIEW",
    REFERRAL = "REFERRAL",
    PARTNER_QR = "PARTNER_QR",
    CAMPAIGN = "CAMPAIGN",
    MANUAL = "MANUAL"
}

export enum VoucherType {
    PERCENTAGE_DISCOUNT = "PERCENTAGE_DISCOUNT",   // e.g 10%
    FIXED_DISCOUNT = "FIXED_DISCOUNT",             // e.g ₦500 off
    FREE_WIFI = "FREE_WIFI",                       // Time-based access
    FREE_ITEM = "FREE_ITEM",                       // Free product/service
}

export enum VoucherStatus {
    UNUSED = "UNUSED",
    USED = "USED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}

export enum RewardScope {
    BUSINESS = "BUSINESS",   // Applies to all branches
    BRANCH = "BRANCH",       // Specific branch only
}

export enum CampaignType {
    INTERNAL = "INTERNAL",       // Created by business
    PARTNERSHIP = "PARTNERSHIP", // CocaCola etc
}

