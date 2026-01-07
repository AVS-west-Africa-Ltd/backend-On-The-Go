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

const router = express.Router();

// Mount routes with versioning
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/app", appRoutes);
router.use("/community", communityRoutes);
router.use("/branches", branchRoutes);

router.use("/products", productRoutes);
router.use("/amenities", amenitiesRoutes);
router.use("/orders", orderRoutes);
router.use("/transactions", transactionRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/admins", adminRoutes);


export default router;
