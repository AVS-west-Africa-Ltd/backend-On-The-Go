"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const { EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_ADDRESS, EMAIL_PASSWORD, } = process.env;
if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_ADDRESS || !EMAIL_PASSWORD) {
    throw new Error("Missing required email environment variables");
}
const transporter = nodemailer_1.default.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: EMAIL_ADDRESS,
        pass: EMAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
});
exports.default = transporter;
