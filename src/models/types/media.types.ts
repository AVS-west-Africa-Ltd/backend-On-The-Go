export const MediaTargetTypes = {
    PROFILE: "profile",
    POST: "post",
    BUSINESS: "business",
    PRODUCT: "product",
    REVIEW: "review",
} as const;

export type TMediaTargetType = typeof MediaTargetTypes[keyof typeof MediaTargetTypes];