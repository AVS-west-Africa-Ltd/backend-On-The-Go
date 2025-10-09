// config/nodemailer.js
const nodemailer = require("nodemailer");

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE, 
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
} = process.env;


const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: EMAIL_SECURE === "true", 
  auth: {
    user: EMAIL_ADDRESS,
    pass: EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, 
  },
});

module.exports = transporter;
