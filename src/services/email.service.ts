
import transporter from "../config/mailer";
import nodemailer, { SendMailOptions, SentMessageInfo } from "nodemailer";
import { EmailOptions, EmailResult } from "../interfaces/email.interface";
import { dashboardActivationEmail } from "../templates/dashboardActivationEmail";

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

export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  try {
    const mailOptions: SendMailOptions = {
      from: `"${process.env.APP_NAME || "OTG AFRICA"}" <${process.env.EMAIL_ADDRESS}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    // should take out later- just for dev seeding data
    const checkIsDevEmail = (to: string | string[] | any): boolean => {
      const addresses = Array.isArray(to) ? to : [to];
      return addresses.some(addr =>
        typeof addr === 'string' && (addr.includes("example.com") || addr.includes("test.com"))
      );
    };

    if (checkIsDevEmail(mailOptions.to)) {
      console.log("📨 [DRY RUN] Email suppressed:", mailOptions.to);
      return { success: true, messageId: 'development' };
    }

    const info: SentMessageInfo = await transporter.sendMail(mailOptions);

    console.log("📨 Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

export const sendDashboardActivationEmail = async (data: {
  to: string;
  fullName: string;
  businessName: string;
  dashboardUrl: string;
}): Promise<EmailResult> => {
  const html = dashboardActivationEmail({
    fullName: data.fullName,
    businessName: data.businessName,
    dashboardUrl: data.dashboardUrl,
  });

  return sendEmail({
    to: data.to,
    subject: `Your OnTheGo Dashboard is Activated - ${data.businessName}`,
    html,
  });
};
