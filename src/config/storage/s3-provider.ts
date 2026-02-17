import { StorageEngine } from "multer";
import multerS3 from "multer-s3";
import AWS3 from "../aws-s3";
import { StorageProvider } from "../../interfaces/storage-provider.interface";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export class S3Provider implements StorageProvider {
    getStorageEngine(): StorageEngine {
        return multerS3({
            s3: AWS3,
            bucket: process.env.AWS_BUCKET_NAME as string,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: (req, file, cb) => {
                cb(null, { fieldName: file.fieldname });
            },
            key: (req, file, cb) => {
                cb(null, `${Date.now()}-${file.originalname}`);
            },
        });
    }

    async upload(file: any, options?: any): Promise<any> {
        // Basic implementation for direct upload if needed
        throw new Error("Method not implemented.");
    }

    async delete(fileId: string): Promise<any> {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileId,
        });
        return await AWS3.send(command);
    }
}
