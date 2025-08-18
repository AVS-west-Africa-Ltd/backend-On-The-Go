const userService = require("../services/UserService");
const bcrypt = require("bcryptjs");
const jwtUtil = require("../utils/jwtUtil");
// const path = require("path");
const multer = require("multer");
const AWS = require("aws-sdk");
const multerS3 = require("multer-s3");
const nodemailer = require("nodemailer");
const {
  EMAIL_HOST,
  EMAIL_ADDRESS,
  EMAIL_PASSWORD,
} = require("../config/config");
const { Op } = require("sequelize");
const crypto = require("crypto");
const { User, DeleteRequest, Referral, sequelize, UserFollower } = require("../models");
const { uploadProfileImage } = require("../utils/upload");
const { RandomCharacters } = require("../helpers");
const sendEmail = require("../services/sendEmail");


class UserController {

  
  static async CreateUser(req, res) {
    try {
      const {
        username,
        email,
        password,
        pushToken,
        phone_number,
        firstName,
        lastName,
        gender,
        isStudent,
        university,
        referralCode,
      } = req.body;

      if (!email || !password || !username || !firstName || !lastName || !gender) {
        return res.status(400).json({
          message:
            "Email, username, password, first name, last name and gender are required",
        });
      }

      // If student, ensure university provided
      if (isStudent && !university) {
        return res.status(400).json({
          message: "University is required for student registration",
          errors: [{ field: "university", message: "Please select your university" }],
        });
      }

      // Check for existing user conflicts
      const whereOr = [{ email }, { username }];
      if (phone_number) whereOr.push({ phone_number });

      const existingUser = await userService.getUserByEmailOrUsername({
        where: { [Op.or]: whereOr },
      });

      if (existingUser) {
        const conflicts = [];
        if (existingUser.email === email) {
          conflicts.push({ field: "email", message: "Email already registered" });
        }
        if (phone_number && existingUser.phone_number === phone_number) {
          conflicts.push({ field: "phone_number", message: "Phone number already used" });
        }
        if (existingUser.username === username) {
          conflicts.push({ field: "username", message: "Username already taken" });
        }

        if (conflicts.length > 0) {
          return res.status(400).json({ message: "Validation error", errors: conflicts });
        }
      }

      const hashedPassword = bcrypt.hashSync(password, 10);

      const user = await userService.createUser({
        ...req.body,
        password: hashedPassword,
        pushToken: pushToken || null,
        followersCount: 0,
        followingCount: 0,
        isStudent: !!isStudent,
        university: isStudent ? university : null,
        referralCode: `OTG-${RandomCharacters(6)}`,
      });

      // Referral handling
      if (referralCode) {
        const referrerUser = await User.findOne({ where: { referralCode } });
        if (referrerUser) {
          await sequelize.transaction(async (t) => {
            await referrerUser.update(
              { successfulReferrals: (referrerUser.successfulReferrals || 0) + 1 },
              { transaction: t }
            );
            await Referral.create(
              { referrerId: referrerUser.id, refereeId: user.id },
              { transaction: t }
            );
          });
        }
      }

      // ---------- WELCOME EMAIL (non-blocking) ----------
      (async () => {
        try {
          const subject = "Welcome to OTG — Stay Connected, Anywhere.";

          // Cloudinary base (no version in base for stability)
          const BASE = "https://res.cloudinary.com/doefjylyu/image/upload";
          // If you prefer the exact versioned hero URL you pasted, you can swap:
          // const HERO = "https://res.cloudinary.com/doefjylyu/image/upload/v1754925446/hero_hpg6la.png";

          const IMG = {
            hero: `${BASE}/f_auto,q_auto/hero_hpg6la.png`,
            reviewBanner: `${BASE}/f_auto,q_auto/review-banner_c5wxhx.png`,
            phoneShot: `${BASE}/f_auto,q_auto/phone-shot.png`,
            business: `${BASE}/f_auto,q_auto/business_n2pxwd.png`,
            community: `${BASE}/f_auto,q_auto/community_wgqksn.png`,
            googleplay: `${BASE}/f_auto,q_auto/googleplay.png`,
            appstore: `${BASE}/f_auto,q_auto/appstore.png`,
          };

          // Links (replace with your real ones)
           const businessLink = "https://onthego.africa/business";
          const instagram = "https://instagram.com/onthegoafrica";
          const tiktok = "https://www.tiktok.com/@onthegoafrica";
          const linkedin = "https://www.linkedin.com/company/onthegoafrica";
          const youtube = "https://www.youtube.com/@onthegoafrica";

          const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Welcome to OTG</title>
<style>
  @media only screen and (max-width:680px){
    .container{width:100% !important}
    .col, .col-2{display:block !important; width:100% !important; max-width:100% !important}
    .p16{padding:16px !important}
    .center{text-align:center !important}
    .hide-m{display:none !important}
  }
  a { color:#1C46FF; }
</style>
</head>
<body style="margin:0;background:#F5F6F8">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F6F8">
    <tr>
      <td align="center" style="padding:24px">
        <table role="presentation" width="640" class="container" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden">
          <!-- Hero -->
          <tr>
            <td>
              <img src="${IMG.hero}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="p16" style="padding:24px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Hey ${firstName || "there"},</p>
              <p style="margin:0;font-size:16px;line-height:24px;color:#334155">
                Welcome to the OTG community—where staying connected is no longer a hustle!
                Whether you're catching up on schoolwork, working on the go, or just exploring,
                we've made it super easy to discover reliable Wi-Fi wherever you go.
              </p>
            </td>
          </tr>
            <td>
              <img src="${IMG.reviewBanner}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>



          <!-- Features list -->
          <tr>
            <td class="p16" style="padding:8px 28px 8px 28px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFF;border-radius:12px">
                <tr>
                  <td style="padding:18px 18px 6px 18px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
                    <ul style="margin:0;padding:0 0 0 18px;color:#334155;font-size:14px;line-height:22px">
                      <li style="margin-bottom:8px"><strong>Find Wi-Fi Hotspots</strong> — Cafes, co-working spaces, lounges, even parks.</li>
                      <li style="margin-bottom:8px"><strong>Real-Time Reviews</strong> — Know where the Wi-Fi is fast, stable, and worth your visit.</li>
                      <li style="margin-bottom:8px"><strong>Drop a Review</strong> — Help others and earn discounts.</li>
                      <li style="margin-bottom:8px"><strong>Follow & Interact</strong> — Connect with friends, businesses, and your city.</li>
                      <li><strong>Get Rewarded</strong> — Reviews and referrals unlock real-life perks.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

            <td>
              <img src="${IMG.business}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>

          <!-- Business CTA -->
          <tr>
            <td class="p16" style="padding:8px 28px 8px 28px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #EEF2FF;border-radius:12px">
                <tr>
                  <td class="col-2" valign="top" style="padding:16px">
                     <p style="font-family:Arial,Helvetica,sans-serif;margin:0 0 12px 0;color:#334155;font-size:14px;line-height:22px">
                      Own a business? Got a spot with Wi-Fi? List on OTG and attract the right crowd every day.
                      Get discovered, receive real feedback, and reward users who show love.
                    </p>
                 
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Community banner -->
          <tr>
            <td style="padding:8px 28px 8px 28px">
              <img src="${IMG.community}" width="100%" alt="Built by the Community, for the Community." style="display:block;border-radius:12px" />
            </td>
          </tr>

          <!-- Social & Footer -->
          <tr>
            <td class="p16" style="padding:8px 28px 24px 28px;font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;line-height:22px">
              <p style="margin:0 0 8px 0">Follow us to stay in the loop</p>
              <p style="margin:0 0 14px 0">
                <a href="${instagram}" style="color:#1C46FF;text-decoration:none">Instagram</a> |
                <a href="${tiktok}" style="color:#1C46FF;text-decoration:none">TikTok</a> |
                <a href="${linkedin}" style="color:#1C46FF;text-decoration:none">LinkedIn</a> |
                <a href="${youtube}" style="color:#1C46FF;text-decoration:none">YouTube</a>
              </p>
            
              <p style="margin:0 0 4px 0">Stay plugged in.</p>
              <p style="margin:0">With 💛,<br/>The OTG Team</p>
              <p style="margin:16px 0 0 0;color:#94A3B8;font-size:12px;text-align:center">&copy; ${new Date().getFullYear()} OnTheGo Africa. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await sendEmail({ to: email, subject, html });
          console.log("[CreateUser] Welcome email sent to:", email);
        } catch (err) {
          console.error("[CreateUser] Failed to send welcome email:", err.message);
        }
      })();
      // ---------- END WELCOME EMAIL ----------

      return res.status(201).json({
        message: "User registered successfully",
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          isStudent: user.isStudent,
          university: user.university,
          referralCode: user.referralCode,
        },
      });
    } catch (error) {
      console.error("Error in CreateUser:", error);

      if (error.name === "SequelizeUniqueConstraintError") {
        const errors =
          error?.errors?.map((err) => ({
            field: err?.path || "unknown",
            message: err?.message || "Unique constraint failed",
          })) || [];
        return res.status(400).json({
          message: "Validation error",
          errors: errors.length > 0 ? errors : [{ field: "unknown", message: "Unique constraint failed" }],
        });
      }

      if (error.status === 400 && Array.isArray(error.errors)) {
        const transformedErrors = error.errors.map((err) => ({
          field: (err.field || "").replace("users_", ""),
          message: `${(err.field || "").replace("users_", "")} is already taken`,
        }));

        return res.status(400).json({
          message: "Registration failed",
          errors: transformedErrors,
        });
      }

      return res.status(500).json({
        error: "Internal server error",
        details: error.message || "Something went wrong",
      });
    }
  }

  static async UpdateUserImage(req, res) {
    try {
      // First handle the file upload
      await new Promise((resolve, reject) => {
        uploadProfileImage.single("profileImage")(req, res, (err) => {
          if (err) {
            console.error("Profile image upload error:", err);
            reject(new Error(`Image upload failed: ${err.message}`));
          } else {
            resolve();
          }
        });
      });

      const { userId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          message: "No profile image provided",
        });
      }

      const user = await userService.updateUser(userId, {
        picture: req.file.location,
      });

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json({
        message: "Profile picture updated successfully",
        info: user.picture,
        // data: {
        //   userId: user.id,
        //   profileImageUrl: user.picture,
        // },
      });
    } catch (error) {
      console.error("Error in UpdateUserImage:", error);
      const statusCode = error.message.includes("upload") ? 400 : 500;
      res.status(statusCode).json({
        message: "Error updating profile picture",
        error: error.message.replace("Image upload failed: ", ""),
      });
    }
  }

  static async Login(req, res) {
    try {
      const { email, password, pushToken } = req.body;

      if (!email || !password)
        return res.status(400).json({ message: "All fields are required" });

      let payload = { where: { email: email } };
      const user = await userService.getUserByEmailOrUsername(payload);

      if (!user)
        return res.status(400).json({ message: "Invalid email or password" });

      const isPasswordMatch = await bcrypt.compareSync(password, user.password);
      if (!isPasswordMatch)
        return res.status(401).json({ message: "Invalid email or password" });

      // Update push token if provided
      if (pushToken) {
        user.pushToken = pushToken;
        await user.save();
      }

      const token = jwtUtil.generateToken(user);
      return res.status(200).json({ token: token, user: user });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async updatePushToken(req, res) {
    try {
      const { userId } = req.params;
      const { pushToken } = req.body;

      if (!pushToken) {
        return res.status(400).json({ message: "Push token is required" });
      }

      const user = await userService.updateUser(userId, { pushToken });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "Push token updated successfully",
        info: { userId: user.id, pushToken: user.pushToken },
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUsers(req, res) {
    try {
      const users = await userService.getUsers();
      if (!users || users.length === 0)
        return res.status(404).json({ message: "No record", info: [] });
      return res.status(200).json({ info: users });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getUserById(req, res) {
    try {
      const { userId } = req.params;

      // Validate userId exists and is a positive integer
      if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
          error: "User ID must be a positive integer",
        });
      }

      const user = await userService.getUserById(Number(userId));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          error: `No user found with ID ${userId}`,
        });
      }

      // Remove sensitive information before sending response
      delete user.password;
      delete user.resetPasswordOTP;
      delete user.resetPasswordExpires;

      return res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        data: user,
      });
    } catch (error) {
      console.error("Detailed error in getUserById:", {
        error: error.message,
        stack: error.stack,
        params: req.params,
        timestamp: new Date().toISOString(),
      });

      const statusCode = error.message.includes("not found") ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Error processing your request",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "An error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      const user = await userService.deleteUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { userId } = req.params;
      console.log(`[updateUser] Called with userId: ${userId}`);
      console.log(`[updateUser] Request body:`, req.body);

      // Validate userId is a positive integer
      if (!userId || !Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
          error: "User ID must be a positive integer",
        });
      }

      const user = await userService.updateUser(userId, req.body);

      if (!user) {
        console.warn(`[updateUser] No user found with ID: ${userId}`);
        return res.status(404).json({
          success: false,
          message: "User not found",
          error: `No user found with ID ${userId}`,
        });
      }

      // Remove sensitive information before sending response
      const userData = user.get ? user.get({ plain: true }) : user;
      delete userData.password;
      delete userData.resetPasswordOTP;
      delete userData.resetPasswordExpires;

      console.log(`[updateUser] User updated successfully:`, userData);
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: userData,
      });
    } catch (error) {
      console.error(
        `[updateUser] Error updating user with ID ${req.params.userId}:`,
        {
          error: error.message,
          stack: error.stack,
          body: req.body,
          timestamp: new Date().toISOString(),
        }
      );

      const statusCode = error.message.includes("not found")
        ? 404
        : error.message.includes("Invalid")
          ? 400
          : 500;

      return res.status(statusCode).json({
        success: false,
        message: "Error updating user",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "An error occurred",
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      });
    }
  }

  static async addFollower(req, res) {
    try {
      const { userId, followedId } = req.params;
      const followUser = await userService.followUser(userId, followedId);

      if (followUser.success !== true) return res.status(400).json({ message: "Following this user failed" });
      return res.status(200).json({ message: "Follower added successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async removeFollower(req, res) {
    try {
      const { userId, followedId } = req.params;
      const user = await userService.unfollowUser(userId, followedId);

      if (!user) return res.status(404).json({ message: "User not found" });

      return res.status(200).json({ message: "Follower removed successfully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async blockFollower(req, res) {
    try {
      const { followedId } = req.body;
      const follower = await UserFollower.findOne({
        where: {
          followerId: req.userId,
          followedId,
          status: "active",
        },
      });

      if(!follower){
        return res.status(400).json({ message: "Error blocking follower" });
      }

      follower.status = "blocked";
      await follower.save();

      return res.status(200).json({ message: "Follower blocked successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error blocking user" });
    }
  }

  static async blockUser(req, res) {
    try {
      const { followedId } = req.body;
      const follower = await UserFollower.create({
        followerId: req.userId,
        followedId,
        status: "blocked",
      });

      return res.status(200).json({ message: "User blocked successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Error blocking user" });
    }
  }

  static async getFollowers(req, res) {
    try {
      const { userId } = req.params;

      const followers = await userService.getFollowers(userId);
      if (!followers)
        return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ followers: followers });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getFollowing(req, res) {
    try {
      const { userId } = req.params;

      const following = await userService.getFollowing(userId);
      if (!following)
        return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ following: following });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { userId } = req.params;

      const userNotification = await userService.getUserNotifications(userId);
      if (!userNotification)
        return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ notifications: userNotification });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markNotificationAsRead(req, res) {
    try {
      const { notificationId, userId } = req.params;

      const notification = await userService.markAsRead(notificationId, userId);
      if (!notification)
        return res.status(404).json({ message: "Notification not found" });
      return res
        .status(200)
        .json({ message: "Notification marked as read", notification });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async markAllNotificationsAsRead(req, res) {
    try {
      const { userId } = req.params;

      const notifications = await userService.markAllAsRead(userId);
      if (!notifications)
        return res.status(404).json({ message: "User not found" });
      return res
        .status(200)
        .json({ message: "All notifications marked as read", notifications });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async addInterests(req, res) {
    try {
      const { userId } = req.params;
      const { icon, title, type } = req.body;
      let newInterest = {
        icon,
        title,
        type,
      };
      const updatedInterests = await userService.addInterest(
        userId,
        newInterest
      );
      return res
        .status(200)
        .json({ message: "Interest added", interests: updatedInterests });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateInterest(req, res) {
    try {
      const { userId, index } = req.params;
      const updatedInterest = req.body;

      const user = await userService.updateInterest(
        userId,
        parseInt(index),
        updatedInterest
      );
      return res
        .status(200)
        .json({ message: "Interest updated successfully", interest: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteInterest(req, res) {
    try {
      const { userId, index } = req.params;
      const updatedInterests = await userService.deleteInterest(
        userId,
        parseInt(index)
      );

      return res.status(200).json({
        message: "Interest deleted successfully",
        interest: updatedInterests,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async ForgotPassword(req, res) {
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

  static async confirmPasswordOTP(req, res) {
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

  static async ResetPassword(req, res) {
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

  static async UserAccountDeleteRequest(req, res) {
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

  static async ApproveUserDeletionRequest(req, res) {
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

  static async DenyUserDeletionRequest(req, res) {
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

  static async GetRandomUsers(req, res) {
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

}

module.exports = UserController;
