import { TStatus } from "../../models/types/amenity.types";
import { TProductStatus } from "../../models/types/product.types";
import { IPaginatedResponse } from "./common.interface";

export interface ICreateProductPayload {
    name: string;
    description: string;
    price: number;
    businessId: number;
    userId: number;
    branchId: number;
    branchAmenityId: string;
    files: Express.Multer.File[] | null;
    meta?: Record<string, unknown>;
}

export interface IGetBranchProductData {
    id: number;
    name: string;
    description: string;
    price: number;
    status: string;
    meta: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
   media: {
        id: number;
        filePath: string;
        fileName: string;
        mimeType: string;
    }[];
    branch_amenity: {
        id: string;
        amenityName: string;
        amenityId: string;
        status: TStatus;
    };
}

export interface IGetBranchProductsResponse extends IPaginatedResponse {
    products: IGetBranchProductData[];
}

export interface IGetProductsQuery {
    cursor?: string;
    limit?: number;
    search?: string;
}

export interface IEditProductInput {
  id: number; // Product ID to edit
  name?: string;
  description?: string;
  price?: number;
  status?: TProductStatus;
  meta?: Record<string, unknown>;
  branchAmenityId?: string;
  media?: {
    keep?: string[]; // IDs of media to keep
    remove?: string[]; // IDs of media to remove
    add?: Express.Multer.File[]; // New media files to add
  };
}