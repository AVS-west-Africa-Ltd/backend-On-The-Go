import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.register(req.body);
    return successHandler(res, "User registered successfully", 201, user);
  } catch (error: any) {
    console.error(error);
    return errorHandler(res, error.message || "Sorry something went wrong!", error.status || 500);
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { user, profile, token } = await AuthService.login(req.body);
    return successHandler(res, "User authenticated successfully", 200, { user, profile, token });
  } catch (error: any) {
    return errorHandler(res, error.message || "Sorry something went wrong!", error.status || 500);
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = await AuthService.verifyEmail(req.body);
    return successHandler(res, "User email verified successfully", 200, token);
  } catch (error: any) {
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
  }
}

export const sendCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await AuthService.sendCode(email);
    return successHandler(res, "Verification code sent successfully", 200);
  } catch (error: any) {
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.resetPassword(req.body);
    return successHandler(res, "User email verified successfully", 200);
  } catch (error: any) {
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
  }
}

export const completeInvite = async (req: Request, res: Response) => {
  try {
    const result = await AuthService.completeInvite(req.body);
    return successHandler(res, "Account created and invitation accepted successfully", 200, result);
  } catch (error: any) {
    console.error(error);
    return errorHandler(res, error.message || "Failed to complete invitation", error.status || 500);
  }
}

export const checkUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    const available = await AuthService.checkUsername(username);
    return successHandler(res, "Username availability checked", 200, available);
  } catch (error: any) {
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
  }
};

export const checkEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const available = await AuthService.checkEmail(email);
    return successHandler(res, "Email availability checked", 200, available);
  } catch (error: any) {
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    await AuthService.changePassword(userId, req.body.oldPassword, req.body.newPassword);
    return successHandler(res, "Password changed successfully", 200);
  } catch (error: any) {
    return errorHandler(res, error.message || "Something went wrong!", error.status || 500);
  }
};
