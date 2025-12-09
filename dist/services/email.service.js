"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const mailer_1 = __importDefault(require("../config/mailer"));
/**
 * Send an email
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - HTML content
 * @param {string|string[]} [options.cc] - CC recipients
 * @param {string|string[]} [options.bcc] - BCC recipients
 * @param {Array} [options.attachments] - Array of attachments
 */
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `"${process.env.APP_NAME || "OTG AFRICA"}" <${process.env.EMAIL_ADDRESS}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
            cc: options.cc,
            bcc: options.bcc,
            attachments: options.attachments,
        };
        const info = await mailer_1.default.sendMail(mailOptions);
        console.log("📨 Email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error("❌ Error sending email:", error);
        return { success: false, error: error.message };
    }
};
exports.sendEmail = sendEmail;
