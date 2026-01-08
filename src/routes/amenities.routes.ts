
import express from "express";
import * as AmenitiesController from "../controllers/AmenityController";
import { authProfile } from "../middlewares/authProfile";

const router = express.Router();
router.use(authProfile);

router.get("/global", AmenitiesController.getAllAmenities);
router.get("/branch/:branchId", AmenitiesController.getBranchAmenities);
router.post("/branch", AmenitiesController.addBranchAmenities);
router.delete("/branch", AmenitiesController.removeBranchAmenities);
export default router;
