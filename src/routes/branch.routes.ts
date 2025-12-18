
import express from "express";
import * as BranchController from "../controllers/BranchController";
import { authProfile } from "../middlewares/authProfile";
import { validateBody } from "../middlewares/validateMiddleware";
import { createBranchSchema } from "../validators/branch.validator";

const router = express.Router();
router.use(authProfile);

// Branch Management
router.get("/activity-logs", BranchController.getBranchLogs);
router.get("/media", BranchController.getBranchMedia);
router.get("/reviews", BranchController.getBranchReviews);
router.get("/:branchId/orders", BranchController.getBranchOrders);
router.get("/:branchId/wifi-infrastructure", BranchController.getBranchWifi);

router.post("/create", validateBody(createBranchSchema), authProfile, BranchController.create);
router.get("/", BranchController.getBranches);
router.get("/:branchId", BranchController.getBranch);
router.delete("/:branchId", BranchController.deleteBranch);
router.patch("/:branchId/status", BranchController.updateBranchStatus);
router.post("/:branchId/invite", BranchController.inviteStaff);



export default router;
