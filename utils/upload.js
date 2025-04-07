const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const sharp = require("sharp");
const path = require("path");

// Validate environment variables before creating S3 client
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS credentials are missing in environment variables");
}
if (!process.env.AWS_REGION) {
  console.warn("AWS_REGION not set, defaulting to us-east-1");
  process.env.AWS_REGION = "us-east-1";
}

// Configure AWS S3 client
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// Function to create upload middleware with customizable options
function createUploadMiddleware(options = {}) {
  // Validate bucket name exists
  if (!process.env.AWS_BUCKET_NAME) {
    throw new Error("AWS_BUCKET_NAME environment variable is required");
  }

  const defaults = {
    folder: "business",
    maxFileSize: 5 * 1024 * 1024, // 5MB limit
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf", // Added PDF support for documents
    ],
    resize: {
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    },
    webpQuality: 80,
  };

  const config = { ...defaults, ...options };

  return multer({
    limits: { fileSize: config.maxFileSize },
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        // Preserve original extension for non-image files
        const extension = config.allowedMimeTypes
          .slice(0, 5)
          .includes(file.mimetype)
          ? ".webp"
          : path.extname(file.originalname);

        const sanitizedName = path
          .parse(file.originalname)
          .name.replace(/[^a-z0-9]/gi, "_");
        cb(null, `${config.folder}/${Date.now()}-${sanitizedName}${extension}`);
      },
      shouldTransform: function (req, file, cb) {
        // Only transform image files (not PDFs or other documents)
        cb(null, file.mimetype.startsWith("image/"));
      },
      transforms: [
        {
          id: "webp_compressed",
          transform: function (req, file, cb) {
            const transform = sharp()
              .webp({
                quality: config.webpQuality,
                lossless: false,
                alphaQuality: 100,
              })
              .resize(config.resize);

            cb(null, transform);
          },
        },
      ],
    }),
    fileFilter: function (req, file, cb) {
      if (config.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            `Invalid file type. Only ${config.allowedMimeTypes.join(
              ", "
            )} are allowed!`
          ),
          false
        );
      }
    },
  });
}

// Pre-configured upload middlewares
const uploadBusinessImages = createUploadMiddleware({
  folder: "business",
  webpQuality: 85,
});

const uploadProfileImage = createUploadMiddleware({
  folder: "profiles",
  webpQuality: 85,
});

const uploadUserAvatars = createUploadMiddleware({
  folder: "avatars",
  resize: { width: 500, height: 500 },
  webpQuality: 90,
});

const uploadGenericFiles = createUploadMiddleware({
  folder: "business",
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "application/pdf",
  ],
});

module.exports = {
  createUploadMiddleware,
  uploadBusinessImages,
  uploadUserAvatars,
  uploadGenericFiles,
  uploadProfileImage,
};
