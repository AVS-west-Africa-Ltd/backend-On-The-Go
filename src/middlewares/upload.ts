import multer, { FileFilterCallback } from "multer";
import path from "path";
import AWS3 from "../config/aws-s3";
import multerS3 from "multer-s3";
import { Request } from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { storageService } from "../services/storage.service";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const ALLOWED_FILE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
};

// Multer file filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    return cb(
      new Error(
        `File type ${file.mimetype} is not allowed. Allowed types: ${Object.keys(
          ALLOWED_FILE_TYPES
        ).join(", ")}`
      )
    );
  }
  cb(null, true);
};


export const upload = multer({
  //  storage: getStorage(),
  storage: storageService.getProvider().getStorageEngine(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});
