import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as jwtUtil from "../utils/jwtUtil";
import { Op } from "sequelize";
import db from "../models";
import { randomCharacters } from "../utils/helpers";
import { sendEmail } from "../services/email.service";
import { verificationCodeEmail } from "../templates/verificationEmail";

const { User, Profile, Referral, Branch, sequelize } = db;

export const register = async (req: Request, res: Response) => {
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
      await t.rollback();
      return res.status(400).json({ message: "Email or phone number exist already!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const code = randomCharacters(6);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone_number,
      password: hashedPassword,
      pushToken: pushToken || null,
      referralCode: `OTG-${randomCharacters(6)}`,
      verificationCode: bcrypt.hashSync(code, 10),
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000)
    }, { transaction: t });


    if (referralCode) {
      const referrerUser = await User.findOne({ where: { referralCode } });
      if (referrerUser) {

        await referrerUser.update(
          {
            successfulReferrals: (referrerUser.successfulReferrals || 0) + 1,
          },
          { transaction: t }
        );
        await Referral.create(
          { referrerId: referrerUser.id, refereeId: user.id },
          { transaction: t }
        );
      }
    }


    const options = {
      html: verificationCodeEmail(code),
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

    await sendEmail(options);
    await t.commit();
    return res.status(201).json({
      message: "User registered successfully",
      user: userPlain
    });

  } catch (error) {
    await t.rollback();
    console.error(error);
    return res.status(500).json({ log: error, message: "Sorry something went wrong!" });
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
    } = req.body;

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

    const isPassword = await bcrypt.compare(password, user.password);

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

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Sorry something went wrong!" });
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const {
      email,
      code,
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Sorry email does not exist !" });
    }

    if (!user.verificationCode) {
      return res.status(400).json({ message: "Invalid code" });
    }

    const isCode = await bcrypt.compare(code, user.verificationCode);
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

  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!" });
  }
}

export const sendCode = async (req: Request, res: Response) => {
  try {
    const {
      email,
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Email does not exist !" });
    }

    const code = randomCharacters(6);

    user.verificationCode = bcrypt.hashSync(code, 10);
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const options = {
      html: verificationCodeEmail(code),
      text: "",
      to: email,
      subject: "Email Verification Code",
      cc: [],
      bcc: [],
      attachments: []
    };

    await sendEmail(options);


    return res.status(200).json({ message: "Verification code sent successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!" });
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const {
      email,
      code,
      password
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    if (!user.verificationCode) {
      return res.status(400).json({ message: "Invalid code" });
    }


    const isCode = await bcrypt.compare(code, user.verificationCode);
    const isExpired = user.verificationExpires ? (new Date() > user.verificationExpires) : false;

    if (!isCode) {
      return res.status(400).json({ message: "Invalid code" });
    }

    if (isExpired) {
      return res.status(400).json({ message: "Expired code" });
    }

    user.password = bcrypt.hashSync(password, 10);
    await user.save();

    return res.status(200).json({
      message: "User email verified successfully",
    });

  } catch (error) {
    return res.status(500).json({ message: "Something went wrong!" });
  }
}


