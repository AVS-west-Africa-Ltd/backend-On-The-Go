"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
// utils/crypto.ts
const crypto_1 = __importDefault(require("crypto"));
const rawKey = process.env.ENCRYPTION_KEY;
if (!rawKey) {
    throw new Error("❌ ENCRYPTION_KEY environment variable is missing.");
}
// Ensure buffer is always exactly 32 bytes (AES-256 requirement)
const ENCRYPTION_KEY = Buffer.from(rawKey, "hex").slice(0, 32);
const IV_LENGTH = 16;
const ALGORITHM = "aes-256-cbc";
function encrypt(text = "") {
    if (!text)
        return text;
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}
function decrypt(text = "") {
    if (!text)
        return text;
    const [ivHex, encryptedHex] = text.split(":");
    if (!ivHex || !encryptedHex)
        return text;
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
}
