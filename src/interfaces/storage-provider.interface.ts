import { StorageEngine } from "multer";

export interface StorageProvider {
    /**
     * Returns the multer storage engine for this provider
     */
    getStorageEngine(): StorageEngine;

    /**
     * Upload a file directly (optional, for non-multer use cases)
     */
    upload(file: any, options?: any): Promise<any>;

    /**
     * Delete a file from storage
     */
    delete(fileId: string): Promise<any>;
}
