import { StorageEngine } from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { StorageProvider } from "../../interfaces/storage-provider.interface";
import { Request } from "express";

export class CloudinaryProvider implements StorageProvider {
    constructor() {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }

    getStorageEngine(): StorageEngine {
        return new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: "uploads",
                public_id: (req: Request, file: Express.Multer.File) =>
                    `${Date.now()}-${file.originalname.split(".")[0]}`,
            } as any,
        }) as unknown as StorageEngine;
    }

    async upload(file: any, options?: any): Promise<any> {
        return await cloudinary.uploader.upload(file, options);
    }

    async delete(fileId: string): Promise<any> {
        return await cloudinary.uploader.destroy(fileId);
    }
}
