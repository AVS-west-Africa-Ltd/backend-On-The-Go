import nodemailer from "nodemailer";


const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE, 
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_ADDRESS || !EMAIL_PASSWORD) {
  throw new Error("Missing required email environment variables");
}

const transporter = nodemailer.createTransport({
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

export default transporter;

