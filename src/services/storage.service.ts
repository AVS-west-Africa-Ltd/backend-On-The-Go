import { StorageProvider } from "../interfaces/storage-provider.interface";
import { S3Provider } from "../config/storage/s3-provider";
import { CloudinaryProvider } from "../config/storage/cloudinary-provider";

export class StorageService {
    private static instance: StorageService;
    private provider: StorageProvider;

    private constructor() {
        const providerType = process.env.UPLOAD_PROVIDER || "cloudinary";

        switch (providerType.toLowerCase()) {
            case "cloudinary":
                this.provider = new CloudinaryProvider();
                break;
            case "s3":
            default:
                this.provider = new S3Provider();
                break;
        }
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    public getProvider(): StorageProvider {
        return this.provider;
    }
}

export const storageService = StorageService.getInstance();
