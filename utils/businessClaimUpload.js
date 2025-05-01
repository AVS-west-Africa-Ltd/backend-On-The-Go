// utils/businessClaimUpload.js
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const extension = file.originalname.split('.').pop();
      cb(null, `business-documents/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2 // Maximum 2 files (CAC and optional)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'image/jpeg' || 
        file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, and PNG are allowed.'), false);
    }
  }
});

module.exports = upload;