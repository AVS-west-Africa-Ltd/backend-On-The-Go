export type MemberType = "community" | "chat";
export type MemberRole = "member" | "admin";

export const MemberType = {
    COMMUNITY: "community",
    CHAT: "chat",
} as const;

export const MemberRole = {
    MEMBER: "member",
    ADMIN: "admin",
} as const;

export type TMemberType = typeof MemberType[keyof typeof MemberType];
export type TMemberRole = typeof MemberRole[keyof typeof MemberRole];