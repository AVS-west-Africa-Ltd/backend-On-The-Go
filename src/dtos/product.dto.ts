import { TProductStatus } from "../models/types/product.types";

export interface ICreateProductDTO {
    name: string;
    description: string;
    price: number;
    branchAmenityId: string;
    meta?: Record<string, unknown>;
}

export interface IUpdateProductDTO {
    name?: string;
    description?: string;
    price?: number;
    status?: TProductStatus;
    branchAmenityId?: string;
    meta?: Record<string, unknown>;
    media?: {
        keep?: string[]; // IDs of media to keep
        remove?: string[]; // IDs of media to remove
        add?: Express.Multer.File[]; // New media files to add
    };
}