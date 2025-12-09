export const AllowedSocialPlatforms = {
    FACEBOOK: "facebook",
    INSTAGRAM: "instagram",
    TWITTER: "twitter",
    LINKEDIN: "linkedin",
    TIKTOK: "tiktok",
    YOUTUBE: "youtube",
    TELEGRAM: "telegram",
    THREADS: "threads",
    OTHER: "other",
} as const;

export type TAllowedSocialPlatforms = typeof AllowedSocialPlatforms[keyof typeof AllowedSocialPlatforms];