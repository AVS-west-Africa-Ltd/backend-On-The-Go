import express from "express";
import * as RewardController from "../../controllers/RewardController";
import { authProfile } from "../../middlewares/authProfile";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validateMiddleware";
import { createRewardRuleSchema, getRewardRulesQuerySchema, getBranchVouchersSchema, getBranchVouchersQuerySchema, manualIssueVoucherSchema } from "../../validators/reward.validator";
import { authAdmin } from "../../middlewares/authAdmin";

const router = express.Router();

router.use(authAdmin); // Admin must have an active profile

router.post("/rules", validateBody(createRewardRuleSchema), RewardController.createRule);
router.get("/rules", validateQuery(getRewardRulesQuerySchema), RewardController.getRules);
router.get("/vouchers/:branchId?", validateParams(getBranchVouchersSchema), validateQuery(getBranchVouchersQuerySchema), RewardController.getBranchVouchers);
router.post("/vouchers/manual", validateBody(manualIssueVoucherSchema), RewardController.manualIssueVoucher);

export default router;
