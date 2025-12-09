export const PostType = {
    REVIEW: "review",
    NORMAL: "normal",
} as const;

export type TPostType = typeof PostType[keyof typeof PostType];

export const PostTargetType = {
    COMMUNITY: "community",
    BUSINESS: "business",
} as const;

export type TPostTargetType = typeof PostTargetType[keyof typeof PostTargetType];