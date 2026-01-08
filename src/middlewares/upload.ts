import multer, { FileFilterCallback } from "multer";
import path from "path";
import AWS3 from "../config/aws-s3";
import multerS3 from "multer-s3";
import { Request } from "express";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

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



// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getStorage = () => {
  if (process.env.UPLOAD_PROVIDER === 'cloudinary') {
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'uploads',
        public_id: (req: Request, file: Express.Multer.File) => `${Date.now()}-${file.originalname.split('.')[0]}`,
      } as any, // Type assertion as needed depending on multer-storage-cloudinary version
    });
  }

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
};


export const upload = multer({
  storage: getStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});
