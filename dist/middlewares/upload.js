"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const aws_s3_1 = __importDefault(require("../config/aws-s3"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_FILE_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    // "video/quicktime": "qt",
    "application/pdf": "pdf",
};
// Multer file filter
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES[file.mimetype]) {
        return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(", ")}`));
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: aws_s3_1.default,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5,
    },
    fileFilter,
});
