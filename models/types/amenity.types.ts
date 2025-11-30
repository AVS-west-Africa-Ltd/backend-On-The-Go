export type AmenityName = "wifi" | "coffee";

export interface AmenityAttributes {
  id?: number;
  userId: number;
  businessId: number;
  branchId: number;
  name: AmenityName;
  rating?: number | null;
  meta?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

