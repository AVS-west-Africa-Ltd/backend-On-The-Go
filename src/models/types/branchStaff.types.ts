export enum BranchStaffRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  RECEPTIONIST = "receptionist",
  WAITER = "waiter",
  CASHIER = "cashier",
}

export interface BranchStaffAttributes {
  id?: string;
  userId?: number | null;
  businessId: number;
  branchId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: BranchStaffRole;
  isActive?: boolean;
  lastLogin?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}