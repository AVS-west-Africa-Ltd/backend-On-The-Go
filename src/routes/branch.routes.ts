
import express from "express";
import * as BranchController from "../controllers/BranchController";
import { authProfile } from "../middlewares/authProfile";
import { validateBody } from "../middlewares/validateMiddleware";
import { createBranchSchema } from "../validators/branch.validator";

const router = express.Router();
router.use(authProfile);

router.post("/create", validateBody(createBranchSchema), authProfile, BranchController.create);
router.get("/", authProfile, BranchController.getBranches);
router.get("/:branchId", authProfile, BranchController.getBranch);
router.delete("/:branchId", authProfile, BranchController.deleteBranch);
router.patch("/:branchId/status", authProfile, BranchController.updateBranchStatus);

export default router;
