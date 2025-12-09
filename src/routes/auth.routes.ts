import express from "express";

import * as authController from "../controllers/AuthController";
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



 export default router;