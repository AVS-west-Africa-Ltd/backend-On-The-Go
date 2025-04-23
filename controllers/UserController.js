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
const UserModel = require("../models/User");
const DeleteRequestModel = require("../models/DeleteRequest");
const { uploadProfileImage } = require("../utils/upload");

// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_BUCKET_NAME,
//     // acl: "public-read",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: function (req, file, cb) {
//       cb(null, `profiles/${Date.now()}-${file.originalname}`);
//     },
//   }),
// });

class UserController {
  static async CreateUser(req, res) {
    try {
      const { username, email, password, pushToken, phone_number } = req.body;

      if (!email || !password || !username) {
        return res.status(400).json({ message: "Email, username and password are required" });
      }


          // Check for existing user conflicts
    const existingUser = await userService.getUserByEmailOrUsername({
      where: {
        [Op.or]: [
          { email },
          { username },
          { phone_number }
        ]
      }
    });

    if (existingUser) {
      const conflicts = [];

      if (existingUser.email === email) {
        conflicts.push({ field: "email", message: "Email already registered" });
      }
      if (existingUser.phone_number === phone_number) {
        conflicts.push({ field: "phone_number", message: "Phone number already used" });
      }
      if (existingUser.username === username) {
        conflicts.push({ field: "username", message: "Username already taken" });
      }

      if (conflicts.length > 0) {
        return res.status(400).json({
          message: "Validation error",
          errors: conflicts
        });
      }
    }

      // Check for both email and username existence
      // const existingUser = await userService.getUserByEmailOrUsername({
      //   where: {
      //     [Op.or]: [
      //       { email: email },
      //       { username: username },
      //       { phone_number:  phone_number }

      //     ]
      //   }
      // });

      // if (existingUser) {
      //   if (existingUser.email === email) {
      //     return res.status(400).json({ message: "Email already registered" });
      //   }
      //   if (existingUser.phone_number === phone_number) {
      //     return res.status(400).json({ message: "Phone number already used" });
      //   }
      //   if (existingUser.username === username) {
      //     return res.status(400).json({ message: "Username already taken" });
      //   }
      // }

      

      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = await userService.createUser({
        ...req.body,
        password: hashedPassword,
        pushToken: pushToken || null,
        followersCount: 0,
        followingCount: 0
      });

      return res.status(201).json({
        message: "User registered successfully",
        data: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Error in CreateUser:', error);

      // if (error.name === 'SequelizeUniqueConstraintError') {
      //   const errors = error.errors.map(err => ({
      //     field: err.path,
      //     message: err.message
      //   }));
      //   return res.status(400).json({
      //     message: "Validation error",
      //     errors: errors
      //   });
      // }

      // return res.status(500).json({
      //   error: "Internal server error",
      //   details: error.message
      // });


  // Check if it's a Sequelize Unique Constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const errors = error?.errors?.map(err => ({
      field: err?.path || "unknown",
      message: err?.message || "Unique constraint failed"
    })) || [];

    return res.status(400).json({
      message: "Validation error",
      errors: errors.length > 0 ? errors : [
        { field: "unknown", message: "Unique constraint failed" }
      ]
    });
    
   
  }
   if (error.status === 400) {
      // Transform the existing error format
      const transformedErrors = error.errors.map(err => ({
        field: err.field.replace('users_', ''),
        message: `${err.field.replace('users_', '')} is already taken`
      }));
  
      return res.status(400).json({
        message: "Registration failed",
        errors: transformedErrors
      });
    }

  // Fallback error
  return res.status(500).json({
    error: "Internal server error",
    details: error.message || "Something went wrong"
  });
    }
  }

  // static async UpdateUserImage(req, res) {
  //   const uploadHandler = upload.single("profileImage");
  //   uploadHandler(req, res, async (err) => {
  //     if (err) {
  //       console.error("Error uploading files:", err);
  //       return res
  //         .status(501)
  //         .json({ message: "Error uploading files", error: err.message });
  //     }

  //     const { userId } = req.params;

  //     try {
  //       const mediaPaths = req.file.location.toString();

  //       const user = await userService.updateUser(userId, {
  //         picture: mediaPaths,
  //       });
  //       if (!user) return res.status(404).json({ message: "User not found" });
  //       return res.status(200).json({
  //         message: "Profile picture updated successfully",
  //         info: user,
  //       });
  //     } catch (error) {
  //       res.status(500).json({
  //         message: "Error uploading picture",
  //         error: error.message,
  //       });
  //     }
  //   });
  // }
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
        info: { userId: user.id, pushToken: user.pushToken }
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

      const user = await userService.getUserById(userId);
      if (!user)
        return res.status(404).json({ message: "User not found", info: {} });
      return res.status(200).json({ info: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
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

      const user = await userService.updateUser(userId, req.body);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res
        .status(200)
        .json({ message: "User updated successfully", info: user });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async addFollower(req, res) {
    try {
      const { userId, followedId } = req.params;
      const user = await userService.followUser(userId, followedId);

      if (!user) return res.status(404).json({ message: "User not found" });
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

  // static async getUserWithFollowers(req, res) {
  //   try {
  //     const { userId } = req.params;
  //
  //     const user = await userService.getUserWithFollowers(userId);
  //     if (!user) return res.status(404).json({ message: "User not found" });
  //     return res.status(200).json({ info: user });
  //   } catch (e) {
  //     return res.status(500).json({ error: e });
  //   }
  // }

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

      const user = await UserModel.findByPk(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Set auto-delete time (e.g., 7 days from request)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create delete request
      await DeleteRequestModel.create({ userId, reason, expiresAt });

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
      const request = await DeleteRequestModel.findByPk(req.params.requestId);
      if (!request)
        return res.status(404).json({ message: "Request not found" });

      await UserModel.destroy({ where: { id: request.userId } });
      await request.destroy();

      res.status(200).json({ message: "User account deleted successfully." });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  static async DenyUserDeletionRequest(req, res) {
    try {
      const request = await DeleteRequestModel.findByPk(req.params.requestId);
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
