const userService = require("../services/Email");
const bcrypt = require("bcryptjs");
const jwtUtil = require("../utils/jwtUtil");
const { Op } = require("sequelize");
const { uploadProfileImage } = require("../utils/upload");
const { RandomCharacters } = require("../helpers");
const Email = require("../services/Email");
const {
  User,
  sequelize
} = require("../models");



  exports.create =async (req, res)=> {
    const t = await sequelize.transaction();
    try {
      const {
        email,
        password,
        pushToken,
        phone_number,
        firstName,
        lastName,
        referralCode = null,
      } = req.body;

      const isExist = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { phone_number: phone_number }
          ]
        }
      });

      if (isExist) {
        return res.status(400).json({message: "Email or phone number exist already!"});
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      const user = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        pushToken: pushToken || null,
        referralCode: `OTG-${RandomCharacters(6)}`,
      }, { transaction: t });

      // Referral handling
      if (referralCode) {
        const referrerUser = await User.findOne({ where: { referralCode } });
        if (referrerUser) {
          
            await referrerUser.update(
              {
                successfulReferrals:
                  (referrerUser.successfulReferrals || 0) + 1,
              },
              { transaction: t }
            );
            await Referral.create(
              { referrerId: referrerUser.id, refereeId: user.id },
              { transaction: t }
            );
        }
      }

      

      await t.commit();
      return res.status(201).json({
        message: "User registered successfully",
        data: {
          id: user.id,
          email: user.email,
          referralCode: user.referralCode,
        },
      });
      
    } catch (error) {
      await t.rollback();
      return res.status(500).json({
        error: "Internal server error",
        details: error.message || "Something went wrong",
      });
    }
  }

  exports.ForgotPassword = async (req, res) => {
    try {
      let props = { where: { email: req.body.email } };

      const user = await userService.getUserByEmailOrUsername(props);

      if (!user) {
        return res.json({ message: "User not found" });
      }

      // Generate a unique token
      const otp = crypto.randomInt(100000, 999999).toString();
      const resetPasswordOTP = otp;
      const resetPasswordExpires = Date.now() + 3600000;

      // Store the token in the user's document
      user.resetPasswordOTP = resetPasswordOTP;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      const emailTemplate = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #233f90; text-align: center;">Password Reset Request</h2>
    <p style="font-size: 16px; color: #333;">
      You are receiving this email because you (or someone else) have requested to reset your password.
    </p>
    <p style="font-size: 16px; color: #333; text-align: center;">
      Below is your <strong>OTP Code</strong>:
    </p>
    <p style="font-size: 24px; font-weight: bold; text-align: center; color: #233f90; border: 2px dashed #233f90; padding: 10px; display: inline-block;">
      ${otp}
    </p>
    <p style="font-size: 16px; color: #333;">
      If you did not request this, please ignore this email, and your password will remain unchanged.
    </p>
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
      &copy; ${new Date().getFullYear()} onthegoAfrica. All rights reserved.
    </p>
  </div>
`;

      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: EMAIL_ADDRESS,
          pass: EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        to: req.body.email,
        from: EMAIL_ADDRESS,
        subject: "Password OTP Request",
        html: emailTemplate,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error(err);
          res.json({ message: "Email could not be sent" });
        } else {
          res
            .status(200)
            .json({ message: "Email sent with password reset instructions" });
        }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  exports.confirmPasswordOTP = async (req, res) => {
    try {
      const { otp } = req.params;
      let props = {
        where: {
          [Op.and]: [
            { resetPasswordOTP: otp },
            { resetPasswordExpires: { [Op.gt]: Date.now() } },
          ],
        },
      };

      const user = await userService.getUserByEmailOrUsername(props);

      if (!user) {
        return res.json({ message: "User with this token not found" });
      } else {
        return res.json({ message: "OTP confirmed" });
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  exports.ResetPassword = async (req, res)=>{
    try {
      const { otp } = req.params;

      let props = {
        where: {
          [Op.and]: [
            { resetPasswordOTP: otp },
            { resetPasswordExpires: { [Op.gt]: Date.now() } },
          ],
        },
      };
      const user = await userService.getUserByEmailOrUsername(props);

      if (!user) {
        return res.json({ message: "User with this token not found" });
      } else {
        const { newPassword } = req.body;

        if (
          user.resetPasswordOTP !== Number(otp) ||
          user.resetPasswordExpires < Date.now()
        ) {
          return res.json({ message: "Invalid or expired token" });
        } else {
          const hashedPassword = bcrypt.hashSync(newPassword, 10);

          user.password = hashedPassword;
          user.resetPasswordOTP = null;
          user.resetPasswordExpires = null;

          await user.save();

          return res.json({ message: "Password reset successful" });
        }
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  exports.UserAccountDeleteRequest = async (req, res)=>{
    try {
      const { userId, reason } = req.body;

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Set auto-delete time (e.g., 7 days from request)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create delete request
      await DeleteRequest.create({ userId, reason, expiresAt });

      // Send email to admin
      const deletionEmailTemplate = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #d9534f;">User Account Deletion Request</h2>
                <p><strong>User:</strong> ${user.email}</p>
                <p><strong>Reason for Deletion:</strong></p>
                <blockquote style="border-left: 4px solid #d9534f; padding-left: 10px; margin: 10px 0; color: #555;">
                    ${reason}
                </blockquote>
                <p>
                    This request will be <strong style="color: #d9534f;">automatically approved</strong> 
                    if no action is taken within <strong>7 days</strong>.
                </p>
                <p style="margin-top: 20px;">
                    <a href="http://onthegoafrica.com/api/v1/approve-delete/${userId}" 
                        style="display: inline-block; padding: 10px 15px; background-color: #5cb85c; color: white; text-decoration: none; border-radius: 5px;">
                        Approve Request
                    </a>
                    <a href="http://onthegoafrica.com/api/v1/deny-delete/${userId}" 
                        style="display: inline-block; padding: 10px 15px; background-color: #d9534f; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">
                        Deny Request
                    </a>
                </p>
            </div>
        `;
      console.log(user.email);
      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: EMAIL_ADDRESS,
          pass: EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        to: EMAIL_ADDRESS,
        from: user.email,
        subject: "User Deletion Request",
        html: deletionEmailTemplate,
      };

      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error(err);
          res.json({ message: "Request could not be sent" });
        } else {
          res.status(200).json({
            message: "Deletion request submitted. Admin will review it soon.",
          });
        }
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  exports.ApproveUserDeletionRequest = async (req, res)=>{
    try {
      const request = await DeleteRequest.findByPk(req.params.requestId);
      if (!request)
        return res.status(404).json({ message: "Request not found" });

      await User.destroy({ where: { id: request.userId } });
      await request.destroy();

      res.status(200).json({ message: "User account deleted successfully." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  exports.DenyUserDeletionRequest = async (req, res) =>{
    try {
      const request = await DeleteRequest.findByPk(req.params.requestId);
      if (!request)
        return res.status(404).json({ message: "Request not found" });

      request.status = "denied";
      await request.save();

      res.status(200).json({ message: "Deletion request denied." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  exports.GetRandomUsers = async (req, res) => {
    try {
      let users = await userService.getUsers();
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No record", info: [] });
      }

      users = users.sort(() => Math.random() - 0.5);

      return res.status(200).json({ info: users.slice(0, 50) });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

