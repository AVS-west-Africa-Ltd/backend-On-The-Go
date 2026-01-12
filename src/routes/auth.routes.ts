import express from "express";
import * as authController from "../controllers/AuthController";
import { authUser } from "../middlewares/authUser";

const router = express.Router();

// Error handling wrapper
const catchErrors = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


router.post("/register", authController.register);
router.post("/login", authController.login);

router.post("/verify-email", authController.verifyEmail);
router.post("/send-code", authController.sendCode);

router.post("/reset-password", authController.resetPassword);
router.post("/complete-invite", authController.completeInvite);

router.post("/check-username", authController.checkUsername);
router.post("/check-email", authController.checkEmail);
router.post("/change-password", authUser, authController.changePassword);

export default router;