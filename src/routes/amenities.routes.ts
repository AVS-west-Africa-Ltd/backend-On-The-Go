
import express from "express";
import * as AmenitiesController from "../controllers/AmenityController";
import { authProfile } from "../middlewares/authProfile";

const router = express.Router();
router.use(authProfile);

router.get("/global", AmenitiesController.getAllAmenities);
router.get("/branch/:branchId", AmenitiesController.getBranchAmenities);
router.put("/branch", AmenitiesController.updateBranchAmenities);
export default router;
