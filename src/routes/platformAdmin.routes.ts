import express from "express";
import { PlatformAdminController } from "../controllers/platformAdmin.controller";
import { authAdmin, authorizeSystemAdmin } from "../middlewares/authAdmin";
import { validateQuery, validateBody } from "../middlewares/validateMiddleware";
import {
    getAllUsersSchema,
    getAllBusinessesSchema,
    getAllBranchesSchema,
    getAllProductsSchema,
    getAllOrdersSchema,
    getAllReviewsSchema,
    getAllPostsSchema,
    getAllCommunitiesSchema,
    getAllInsightsSchema,
    getAllRewardsSchema,
    getAllVouchersSchema,
    getAllWifiProfilesSchema,
    getAllWifiTicketsSchema,
    getAllWifiVouchersSchema,
    getAllSettingsSchema,
    loginSchema,
    changePasswordSchema
} from "../validators/platformAdmin.validator";
import { AdminPermission } from "../models/types/admin.types";

const router = express.Router();

// Public Authentication
router.post("/auth/login", validateBody(loginSchema), PlatformAdminController.login);

// All other routes require Platform Admin authentication
router.use(authAdmin);
router.use(authorizeSystemAdmin);

router.post("/auth/change-password", validateBody(changePasswordSchema), PlatformAdminController.changePassword);

router.get("/users", validateQuery(getAllUsersSchema), PlatformAdminController.getAllUsers);
router.get("/businesses", validateQuery(getAllBusinessesSchema), PlatformAdminController.getAllBusinesses);
router.get("/branches", validateQuery(getAllBranchesSchema), PlatformAdminController.getAllBranches);
router.get("/products", validateQuery(getAllProductsSchema), PlatformAdminController.getAllProducts);
router.get("/orders", validateQuery(getAllOrdersSchema), PlatformAdminController.getAllOrders);
router.get("/reviews", validateQuery(getAllReviewsSchema), PlatformAdminController.getAllReviews);
router.get("/posts", validateQuery(getAllPostsSchema), PlatformAdminController.getAllPosts);
router.get("/communities", validateQuery(getAllCommunitiesSchema), PlatformAdminController.getAllCommunities);
router.get("/insights", validateQuery(getAllInsightsSchema), PlatformAdminController.getAllInsights);
router.get("/rewards", validateQuery(getAllRewardsSchema), PlatformAdminController.getAllRewards);
router.get("/vouchers", validateQuery(getAllVouchersSchema), PlatformAdminController.getAllVouchers);
router.get("/wifi-profiles", validateQuery(getAllWifiProfilesSchema), PlatformAdminController.getAllWifiProfiles);
router.get("/wifi-tickets", validateQuery(getAllWifiTicketsSchema), PlatformAdminController.getAllWifiTickets);
router.get("/wifi-vouchers", validateQuery(getAllWifiVouchersSchema), PlatformAdminController.getAllWifiVouchers);
router.get("/settings", validateQuery(getAllSettingsSchema), PlatformAdminController.getAllSettings);

export default router;
