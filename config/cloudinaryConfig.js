const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "duoowadag",
  api_key: process.env.CLOUDINARY_API_KEY || "398385429436433",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "hvkIda3LtrBT9z8vrhuxwxFWfWQ",
});

module.exports = cloudinary;
