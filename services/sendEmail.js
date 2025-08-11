// services/sendEmail.js
require("dotenv").config();
const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.error("Missing EMAIL_USER or EMAIL_PASS in environment variables.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

/**
 * @param {{to:string, subject:string, text?:string, html?:string, attachments?:Array}} emailData
 */
const sendEmail = async (emailData) => {
  const { to, subject, text, html, attachments } = emailData;

  if (!to || !subject || (!text && !html)) {
    throw new Error("Missing required fields: to, subject, text or html");
  }

  const mailOptions = {
    from: `"OTG Reminder" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, response: info.response };
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
