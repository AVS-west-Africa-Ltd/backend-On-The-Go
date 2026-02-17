import { IPaginatedResponse } from "./common.interface";
import { Branch } from "../models/Branch";
import { BranchStaffRole } from "../models/types/branchStaff.types";
import { DayOfWeek } from "../models/types/openingHour.types";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { BranchStaff } from "../models/BranchStaff";
import { Media } from "../models/Media";
import { Post } from "../models/Post";
import { TReviewSortType } from "../models/types/post.types";

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
  geoLocation?: number[];
}

export interface IBranchStaff {
  // fullName: string;
  firstName: string;
  lastName: string
  role: BranchStaffRole;
  email: string;
}

export interface IGetBranchesResponse extends IPaginatedResponse {
  branches: IGetBranchesData[];
}

export interface IGetBranchesData {
  id: number;
  name: string;
  admin: { firstname: string; lastname: string; email: string } | null;
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

export interface IBranchDashboardResponse {
  branchInfo: {
    id: number;
    name: string;
    description: string | null;
    fullAddress: string;
    state: string;
    city: string;
    rating: number;
    followers: number;
    status: string;
    registrationDate: Date;
    lastLogin: Date | null;
  };
  stats: {
    totalRevenue: number;
    activeCustomers: number;
    activeWifiSessions: number;
    revenueGrowth: number;
    customerGrowth: number;
    wifiGrowth: number;
  };
  chartData: {
    revenue: Array<{ month: string; amount: number }>;
    wifi: Array<{ month: string; sessions: number }>;
  };
  tabs: {
    orders: Order[];
    wifiInfrastructure: any | null;
    productsAndAmenities: Partial<Product>[];
    adminAndStaff: BranchStaff[];
    activityLog: any[];
    picturesAndVideos: Partial<Media>[];
    reviews: Post[];
  };
}

export interface IGetBranchOrdersQuery extends IGetBranchesQuery {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface IGetBranchLogsQuery extends IGetBranchesQuery {
  action?: string;
  userId?: number;
}

export interface IGetBranchMediaQuery extends IGetBranchesQuery {
  mimeType?: string;
}

export interface IGetBranchReviewsQuery extends IGetBranchesQuery {
  rating?: number;
  sortBy?: TReviewSortType;
}
