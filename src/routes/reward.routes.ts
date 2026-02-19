import express from "express";
import * as RewardController from "../controllers/RewardController";
import { authProfile } from "../middlewares/authProfile";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import { getMyVouchersQuerySchema, redeemVoucherSchema } from "../validators/reward.validator";

const router = express.Router();

router.use(authProfile);

router.get("/my-vouchers", validateQuery(getMyVouchersQuerySchema), RewardController.getMyVouchers);
router.post("/vouchers/redeem", validateBody(redeemVoucherSchema), RewardController.redeemVoucher);

export default router;
