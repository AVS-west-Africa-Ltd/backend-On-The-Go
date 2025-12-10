import { Request, Response } from "express";
import db from "../models";
import { AuthService } from "../services/auth.service";

const { User } = db;

export const register = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.register(req.body);
    return res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (error: any) {
    console.error(error);
    if (error.message === "Email or phone number exist already!") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ log: error, message: "Sorry something went wrong!" });
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    // Check if User model is loaded correctly (optional legacy check)
    if (!User) {
      console.error("User model is undefined. Check models/index.ts");
      return res.status(500).json({ message: "Internal Server Error: DB Misconfiguration" });
    }

    const { user, profile, token } = await AuthService.login(req.body);

    return res.status(200).json({
      message: "User authenticated successfully",
      user,
      profile,
      token
    });

  } catch (error: any) {
    console.log(error);
    if (error.message === "Sorry email does not exist !" || error.message === "Sorry check password!") {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === "Internal Server Error: DB Misconfiguration") {
      return res.status(500).json({ message: error.message });
    }
    return res.status(500).json({ message: "Sorry something went wrong!" });
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = await AuthService.verifyEmail(req.body);

    return res.status(200).json({
      token,
      message: "User email verified successfully",
    });

  } catch (error: any) {
    if (error.message === "Sorry email does not exist !" || error.message === "Invalid code" || error.message === "Expired code") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Something went wrong!" });
  }
}

export const sendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await AuthService.sendCode(email);

    return res.status(200).json({ message: "Verification code sent successfully" });

  } catch (error: any) {
    if (error.message === "Email does not exist !") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Something went wrong!" });
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.resetPassword(req.body);

    return res.status(200).json({
      message: "User email verified successfully", // Original message was "User email verified successfully", assume intent for password reset success
    });

  } catch (error: any) {
    if (error.message === "User not found!" || error.message === "Invalid code" || error.message === "Expired code") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Something went wrong!" });
  }
}


