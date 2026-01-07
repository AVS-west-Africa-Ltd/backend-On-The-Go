export interface ActivityLogAttributes {
    id: string;
    branchId: number;
    userId: number;
    action: string;
    details: Record<string, any> | null;
    createdAt?: Date;
    updatedAt?: Date;
}
