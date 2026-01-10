
import express from "express";
import * as BranchController from "../controllers/BranchController";
import { authProfile } from "../middlewares/authProfile";
import { validateBody } from "../middlewares/validateMiddleware";
import { createBranchSchema, inviteStaffSchema } from "../validators/branch.validator";
import { authAdmin, authorizeAdmin } from "../middlewares/authAdmin";
import { AdminPermission } from "../models/types/admin.types";

const router = express.Router();
router.use(authAdmin);

// Branch Management
router.get("/activity-logs", BranchController.getBranchLogs);
router.get("/media", BranchController.getBranchMedia);
router.get("/reviews", BranchController.getBranchReviews);


router.post("/create", validateBody(createBranchSchema), authProfile, BranchController.create);
router.get("/", authorizeAdmin(AdminPermission.MANAGE_ALL_BRANCHES), BranchController.getBranches);
router.get("/:branchId", BranchController.getBranch);
router.delete("/:branchId", authorizeAdmin(AdminPermission.MANAGE_ALL_BRANCHES), BranchController.deleteBranch);
router.patch("/:branchId/status", BranchController.updateBranchStatus);
router.post("/:branchId/invite", validateBody(inviteStaffSchema), BranchController.inviteStaff);
router.get("/:branchId/orders", BranchController.getBranchOrders);
router.get("/:branchId/staff", BranchController.getBranchStaff);
router.get("/:branchId/wifi-infrastructure", BranchController.getBranchWifi);



export default router;
