const multer = require("multer");
const path = require("path");
const S3 = require("../config/aws-s3");
const multerS3 = require("multer-s3");

// Maximum file size (5MB)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/quicktime": "qt",
  // 'application/pdf': 'pdf'
};

// File filter function
const fileFilter = (req, file, cb) => {
  if (!ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(
      new Error(
        `File type ${
          file.mimetype
        } is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(
          ", "
        )}`
      ),
      false
    );
    return;
  }
  cb(null, true);
};

exports.upload = (folder)=>{
    return multer({
        storage: multerS3({
            s3: S3,
            bucket: process.env.AWS_BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
            cb(null, `${folder}/${Date.now()}-${file.originalname}`);
            },
        }),
        limits: {
            fileSize: MAX_FILE_SIZE,
            files: 5, // Maximum number of files per upload
        },
        fileFilter: fileFilter,
    });
}