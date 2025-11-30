const multer = require("multer");
const path = require("path");
const AWS3 = require("../config/aws-s3");
const multerS3 = require("multer-s3");
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "video/quicktime": "qt",
    'application/pdf': 'pdf'
};
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES[file.mimetype]) {
        cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(", ")}`), false);
        return;
    }
    cb(null, true);
};
const upload = multer({
    storage: multerS3({
        s3: AWS3,
        bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    }),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 5,
    },
    fileFilter: fileFilter,
});
module.exports = upload;
