export const ProfileType = {
  PERSONAL: "personal",
  BUSINESS: "business",
} as const;

export type TProfileType = typeof ProfileType[keyof typeof ProfileType];

export const BusinessCategory = {
    SME: "sme",
    LARGE_ENTERPRISE: "large_enterprise",
} as const;

export type TBusinessCategory = typeof BusinessCategory[keyof typeof BusinessCategory];