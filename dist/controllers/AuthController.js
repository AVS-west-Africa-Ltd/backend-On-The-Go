"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.sendCode = exports.verifyEmail = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwtUtil = __importStar(require("../utils/jwtUtil"));
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const helpers_1 = require("../utils/helpers");
const email_service_1 = require("../services/email.service");
const verificationEmail_1 = require("../templates/verificationEmail");
const { User, Profile, Referral, Branch, sequelize } = models_1.default;
const register = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { email, password, pushToken, phone_number, firstName, lastName, referralCode = null, } = req.body;
        const isExist = await User.findOne({
            where: {
                [sequelize_1.Op.or]: [
                    { email: email },
                    { phone_number: phone_number }
                ]
            }
        });
        if (isExist) {
            await t.rollback();
            return res.status(400).json({ message: "Email or phone number exist already!" });
        }
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const code = (0, helpers_1.randomCharacters)(6);
        const user = await User.create({
            firstName,
            lastName,
            email,
            phone_number,
            password: hashedPassword,
            pushToken: pushToken || null,
            referralCode: `OTG-${(0, helpers_1.randomCharacters)(6)}`,
            verificationCode: bcryptjs_1.default.hashSync(code, 10),
            verificationExpires: new Date(Date.now() + 15 * 60 * 1000)
        }, { transaction: t });
        if (referralCode) {
            const referrerUser = await User.findOne({ where: { referralCode } });
            if (referrerUser) {
                await referrerUser.update({
                    successfulReferrals: (referrerUser.successfulReferrals || 0) + 1,
                }, { transaction: t });
                await Referral.create({ referrerId: referrerUser.id, refereeId: user.id }, { transaction: t });
            }
        }
        const options = {
            html: (0, verificationEmail_1.verificationCodeEmail)(code),
            text: "",
            to: email,
            subject: "Email Verification Code",
            cc: [],
            bcc: [],
            attachments: []
        };
        const userPlain = user.toJSON();
        delete userPlain.password;
        delete userPlain.verificationCode;
        await (0, email_service_1.sendEmail)(options);
        await t.commit();
        return res.status(201).json({
            message: "User registered successfully",
            user: userPlain
        });
    }
    catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ log: error, message: "Sorry something went wrong!" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password, } = req.body;
        // Check if User model is loaded correctly
        if (!User) {
            console.error("User model is undefined. Check models/index.ts");
            return res.status(500).json({ message: "Internal Server Error: DB Misconfiguration" });
        }
        const user = await User.findOne({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ message: "Sorry email does not exist !" });
        }
        const isPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isPassword) {
            return res.status(400).json({ message: "Sorry check password!" });
        }
        const profile = await Profile.findOne({
            where: { userId: user.id }
        });
        // Fix: Handle null profile before querying Branch
        let branch = null;
        if (profile) {
            branch = await Branch.findOne({
                where: {
                    profileId: profile.id,
                    isHQ: true
                }
            });
        }
        const auth = {
            user: user.id,
            profile: profile ? { id: profile.id, type: profile.profileType } : null,
            branch: branch ? branch.id : null
        };
        const token = jwtUtil.generateToken(auth);
        return res.status(200).json({
            message: "User authenticated successfully",
            user,
            profile,
            token
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Sorry something went wrong!" });
    }
};
exports.login = login;
const verifyEmail = async (req, res) => {
    try {
        const { email, code, } = req.body;
        const user = await User.findOne({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ message: "Sorry email does not exist !" });
        }
        if (!user.verificationCode) {
            return res.status(400).json({ message: "Invalid code" });
        }
        const isCode = await bcryptjs_1.default.compare(code, user.verificationCode);
        const isExpired = user.verificationExpires ? (new Date() > user.verificationExpires) : false;
        console.log("expired?----", isExpired);
        if (!isCode) {
            return res.status(400).json({ message: "Invalid code" });
        }
        if (isExpired) {
            return res.status(400).json({ message: "Expired code" });
        }
        user.isVerified = true;
        await user.save();
        const auth = { user: user.id, profile: null, branch: null };
        return res.status(200).json({
            token: jwtUtil.generateToken(auth),
            message: "User email verified successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Something went wrong!" });
    }
};
exports.verifyEmail = verifyEmail;
const sendCode = async (req, res) => {
    try {
        const { email, } = req.body;
        const user = await User.findOne({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ message: "Email does not exist !" });
        }
        const code = (0, helpers_1.randomCharacters)(6);
        user.verificationCode = bcryptjs_1.default.hashSync(code, 10);
        user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        const options = {
            html: (0, verificationEmail_1.verificationCodeEmail)(code),
            text: "",
            to: email,
            subject: "Email Verification Code",
            cc: [],
            bcc: [],
            attachments: []
        };
        await (0, email_service_1.sendEmail)(options);
        return res.status(200).json({ message: "Verification code sent successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Something went wrong!" });
    }
};
exports.sendCode = sendCode;
const resetPassword = async (req, res) => {
    try {
        const { email, code, password } = req.body;
        const user = await User.findOne({
            where: { email },
        });
        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (!user.verificationCode) {
            return res.status(400).json({ message: "Invalid code" });
        }
        const isCode = await bcryptjs_1.default.compare(code, user.verificationCode);
        const isExpired = user.verificationExpires ? (new Date() > user.verificationExpires) : false;
        if (!isCode) {
            return res.status(400).json({ message: "Invalid code" });
        }
        if (isExpired) {
            return res.status(400).json({ message: "Expired code" });
        }
        user.password = bcryptjs_1.default.hashSync(password, 10);
        await user.save();
        return res.status(200).json({
            message: "User email verified successfully",
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Something went wrong!" });
    }
};
exports.resetPassword = resetPassword;
