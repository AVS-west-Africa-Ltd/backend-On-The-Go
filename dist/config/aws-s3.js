"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
if (!accessKeyId || !secretAccessKey || !region) {
    throw new Error("Missing AWS S3 configuration in environment variables.");
}
const AWS3 = new client_s3_1.S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
});
exports.default = AWS3;
