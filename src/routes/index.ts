import express from "express";
import authRoutes from "./auth.routes";
import profileRoutes from "./profile.routes";
import appRoutes from "./app.routes";
import communityRoutes from "./community.routes";
import branchRoutes from "./branch.routes";
import productRoutes from "./product.routes";
import amenitiesRoutes from "./amenities.routes";
import orderRoutes from "./order.routes";
import webhookRoutes from "./webhook.routes";
import transactionRoutes from "./transaction.routes";
import bookmarkRoutes from "./bookmark.routes";
import adminRoutes from "./admin.routes";
import socialRoutes from "./social.routes";
import analyticsRoutes from "./analytics.routes";
import chatRoutes from "./chat.routes";
import searchRoutes from "./search.routes";
import rewardRoutes from "./reward.routes";
import adminRootRouter from "./admin/index";
import mikrotikRoutes from "./mikrotik.routes";
import platformAdminRoutes from "./platformAdmin.routes";
import { SystemController } from "../controllers/system.controller";

const router = express.Router();

// Health Check
router.get("/health", SystemController.getHealth);

// Mount routes with versioning
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/app", appRoutes);
router.use("/community", communityRoutes);
// router.use("/branches", branchRoutes);

// router.use("/products", productRoutes);
router.use("/amenities", amenitiesRoutes);
router.use("/orders", orderRoutes);
router.use("/transactions", transactionRoutes);
router.use("/bookmarks", bookmarkRoutes);
// router.use("/admins", adminRoutes);

router.use("/social", socialRoutes);
// router.use("/analytics", analyticsRoutes);
router.use("/chats", chatRoutes);
router.use("/search", searchRoutes);
router.use("/mikrotik", mikrotikRoutes);
router.use("/rewards", rewardRoutes);
router.use("/platform-admin", platformAdminRoutes);

// Grouped Admin Dashboard Routes
router.use("/admin", adminRootRouter);


export default router;
