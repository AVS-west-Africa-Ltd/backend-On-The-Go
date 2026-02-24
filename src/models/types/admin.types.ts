export enum AdminRole {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    SYSTEM_OWNER = "system_owner",
    SYSTEM_ADMIN = "system_admin",
}

export enum AdminPermission {
    MANAGE_STAFF = "manage_staff",
    MANAGE_PRODUCTS = "manage_products",
    MANAGE_ORDERS = "manage_orders",
    MANAGE_BRANCH = "manage_branch",
    MANAGE_ALL_BRANCHES = "manage_all_branches",
    MANAGE_OVERALL_BUISNESS = "manage_overall_business",
    VIEW_INSIGHTS = "view_insights",
    MANAGE_AMENITIES = "manage_amenities",
    MANAGE_COMMUNITY = "manage_community",
}

export interface AdminAttributes {
    id?: number;
    profileId: number;
    branchId: number;
    businessId: number;
    role: AdminRole;
    name: string;
    email: string;
    password: string;
    permissions?: AdminPermission[];
    createdAt?: Date;
    updatedAt?: Date;
}
