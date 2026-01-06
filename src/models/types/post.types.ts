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

export const ReviewSortType = {
    MOST_RECENT: "most_recent",
    MOST_RELEVANT: "most_relevant",
    HIGHEST_RATING: "highest_rating",
    LOWEST_RATING: "lowest_rating",
} as const;

export type TReviewSortType = typeof ReviewSortType[keyof typeof ReviewSortType];