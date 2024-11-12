import User from "../models/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Tracer } from "../utils/LoggerTracer.js";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import STATUS from "../utils/HttpResponse.js";
import config from "../utils/config.js";

export const userControllers = {
  //   signupUser: async (req, res) => {
  //     try {
  //       // Validate input fields
  //       const { fullName, bio, username, email, password } = req.body;
  //       if (!username || !email || !password || !fullName || !bio)
  //         return res.status(400).json({
  //           STATUS: STATUS.STATUS_BAD_REQUEST.code,
  //           MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
  //           error: "All fields are required",
  //         });

  //       // Check if username already exists

  //       const existingUsernameUser = await User.findOne({ username });
  //       if (existingUsernameUser)
  //         return res.status(400).json({
  //           STATUS: STATUS.STATUS_BAD_REQUEST.code,
  //           MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
  //           error: "Username is already taken",
  //         });
  //       const existingEmailUser = await User.findOne({ email });
  //       if (existingEmailUser)
  //         return res.status(400).json({
  //           STATUS: STATUS.STATUS_BAD_REQUEST.code,
  //           MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
  //           error: "Email is already registered",
  //         });

  //       const verificationToken = crypto.randomBytes(32).toString("hex");
  //       const verificationCode = nanoid(6);
  //       const baseURL = process.env.BASE_URL || "http://localhost:2000";
  //       const verificationLink = `${baseURL}/verify?token=${verificationToken}`;
  //       const sendVerificationEmail = async (
  //         email,
  //         verificationLink,
  //         verificationCode
  //       ) => {
  //         const transporter = nodemailer.createTransport({
  //           host: "smtp.ethereal.email",
  //           port: 587,
  //           auth: { user: "freida40@ethereal.email", pass: "bbvTKK4f9ydqRXd44R" },
  //         });
  //         const mailOptions = {
  //           from: "freida40@ethereal.email",
  //           to: email,
  //           subject: "Verify Your Email",
  //           text: `Please click the following link to verify your email: ${verificationLink}\n\nVerification Code: ${verificationCode}`,
  //         };
  //         await transporter.sendMail(mailOptions);
  //       };
  //       const hashedPassword = await bcrypt.hash(password, 10);
  //       const newUser = new User({
  //         username,
  //         email,
  //         password: hashedPassword,
  //         verifiedEmail: false,
  //         verificationToken,
  //       });
  //       const isStrongPassword =
  //         /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$/.test(password);
  //       if (!isStrongPassword)
  //         return res.json({ error: "Password must meet certain criteria" });
  //       await sendVerificationEmail(email, verificationLink, verificationCode);
  //       await newUser.save();
  //       res.json({ message: "User created successfully", user: newUser });
  //     } catch {
  //       res.json({ error: "Internal Server Error" });
  //     }
  //   },

  signupUser: async (req, res) => {
    try {
      const { fullName, bio, username, email, password } = req.body;

      // Validate input fields
      if (!username || !email || !password || !fullName || !bio) {
        return res.status(400).json({
          STATUS: STATUS.STATUS_BAD_REQUEST.code,
          MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
          error: "All fields are required",
        });
      }

      // Check if username already exists
      const existingUsernameUser = await User.findOne({ username });
      if (existingUsernameUser) {
        return res.status(400).json({
          STATUS: STATUS.STATUS_BAD_REQUEST.code,
          MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
          error: "Username is already taken",
        });
      }

      // Check if email already exists
      const existingEmailUser = await User.findOne({ email });
      if (existingEmailUser) {
        return res.status(400).json({
          STATUS: STATUS.STATUS_BAD_REQUEST.code,
          MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
          error: "Email is already registered",
        });
      }

      // Generate verification token and code
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationCode = nanoid(6);
      const baseURL = config.BASE_URL || "http://localhost:2000";
      const verificationLink = `${baseURL}/verify?token=${verificationToken}`;

      // Send verification email
      const sendVerificationEmail = async (
        email,
        verificationLink,
        verificationCode
      ) => {
        const transporter = nodemailer.createTransport({
          config: nodemaillerconfig,
        });

        const mailOptions = {
          from: "freida40@ethereal.email",
          to: email,
          subject: "Verify Your Email",
          text: `Please click the following link to verify your email: ${verificationLink}\n\nVerification Code: ${verificationCode}`,
        };

        await transporter.sendMail(mailOptions);
      };

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Validate password strength
      const isStrongPassword =
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).{8,}$/.test(password);
      if (!isStrongPassword) {
        return res.status(400).json({
          STATUS: STATUS.STATUS_BAD_REQUEST.code,
          MESSAGE: STATUS.STATUS_BAD_REQUEST.response,
          error: "Password must meet certain criteria",
        });
      }

      // Create new user
      const newUser = new User({
        fullName,
        bio,
        username,
        email,
        password: hashedPassword,
        verifiedEmail: false,
        verificationToken,
      });

      // Save the user and send the verification email
      await newUser.save();
      await sendVerificationEmail(email, verificationLink, verificationCode);

      res.status(201).json({
        STATUS: STATUS.STATUS_CREATED.code,
        MESSAGE: STATUS.STATUS_CREATED.response,
        message: "User created successfully",
        user: newUser,
      });
    } catch (error) {
      Tracer("CREATE ADMIN", error.message, error);
      res.status(500).json({
        STATUS: STATUS.STATUS_SERVER_ERROR.code,
        MESSAGE: STATUS.STATUS_SERVER_ERROR.response,
        error: "Internal Server Error",
      });
    }
  },

  signinUser: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.json({ error: "Please enter all required fields" });
      const user = await User.findOne({ email });
      if (!user)
        return res.json({ error: "User not found. Create an account" });
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.json({ error: "Invalid password" });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          gender: user.gender,
        },
      });
    } catch {
      res.json({ error: "Internal Server Error" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const deletedUser = await User.findByIdAndDelete(userId);
      if (!deletedUser) return res.json({ error: "User not found" });
      res.json({ message: "User deleted successfully", user: deletedUser });
    } catch {
      res.json({ error: "Internal Server Error" });
    }
  },

  getUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.json({ users });
    } catch {
      res.json({ error: "Internal Server Error" });
    }
  },

  getUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await User.findById(userId);
      if (!user) return res.json({ error: "User not found" });
      res.json({ user });
    } catch {
      res.json({ error: "Internal Server Error" });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { username, email, gender } = req.body;
      const userId = req.params.id;
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, email, gender },
        { new: true }
      );
      if (!updatedUser) return res.json({ error: "User not found" });
      res.json({
        message: "User profile updated successfully",
        user: updatedUser,
      });
    } catch {
      res.json({ error: "Internal Server Error" });
    }
  },
};
