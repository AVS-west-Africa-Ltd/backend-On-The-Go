import { IPaginatedResponse } from "./common.interface";
import { Branch } from "../../models/Branch";
import { BranchStaffRole } from "../../models/types/branchStaff.types";
import { DayOfWeek } from "../../models/types/openingHour.types";

export interface ICreateBranchPayload {
  name: string;
  fullAddress: string;
  streetAddress?: string;
  isHQ: boolean;
  state?: string;
  country?: string;
  city?: string;
  description?: string;
  working_hours: Record<DayOfWeek, { open: string; close: string }>;
  amenities: string[];
  staff: IBranchStaff[];
}

export interface IBranchStaff {
  fullName: string;
  role: BranchStaffRole;
  email: string;
}

export interface IGetBranchesResponse extends IPaginatedResponse {
  branches: IGetBranchesData[];
}

export interface IGetBranchesData {
  id: number;
name: string;
  admin: { fullname: string; email: string } | null;
  state: string;
  city: string;
  created_at: Date;
  status: string;
  isHQ: boolean;
}

export interface IGetBranchesQuery {
  cursor?: string;
  limit?: number;
  search?: string;
}

