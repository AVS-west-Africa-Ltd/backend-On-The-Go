import express from "express";
import * as AnalyticsController from "../controllers/analytics.controller";
import { authProfile } from "../middlewares/authProfile";

const router = express.Router();

router.use(authProfile);

router.get("/summary", AnalyticsController.getAnalyticsSummary);
router.get("/profile-visits", AnalyticsController.getProfileVisits);
router.get("/engagement", AnalyticsController.getEngagement);
router.get("/sales", AnalyticsController.getSalesStats);

export default router;
