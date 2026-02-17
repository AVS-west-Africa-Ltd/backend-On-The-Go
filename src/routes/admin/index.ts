import express from "express";
import analyticsRoutes from "../analytics.routes";
import branchRoutes from "../branch.routes";
import adminManagementRoutes from "../admin.routes";
import productRoutes from "../product.routes";
import rewardAdminRoutes from "./reward.admin.routes";
import { login, getAllPermissions, getAllRoles } from "../../controllers/AdminController";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validateMiddleware";
import { loginAdminSchema } from "../../validators/admin.validator";
import { OrderController } from "../../controllers/OrderController";
import { authAdmin } from "../../middlewares/authAdmin";
import { getBranchOrdersSchema, getOrderByIdSchema, updateOrderItemsSchema, updateOrderStatusSchema } from "../../validators/order.validator";

const adminRouter = express.Router();

adminRouter.use("/analytics", analyticsRoutes);
adminRouter.use("/branches", branchRoutes);
adminRouter.use("/products", productRoutes);
adminRouter.use("/rewards", rewardAdminRoutes);
// Public Admin Routes (No prefix)
adminRouter.post("/login", validateBody(loginAdminSchema), login);
adminRouter.get("/permissions", getAllPermissions);
adminRouter.get("/roles", getAllRoles);

// Management Routes (With prefix)
adminRouter.use("/staff", adminManagementRoutes);

// admin orders
adminRouter.get("/orders", authAdmin, validateQuery(getBranchOrdersSchema), OrderController.getBranchOrders);
adminRouter.put("/orders/:id/items", authAdmin, validateParams(getOrderByIdSchema), validateBody(updateOrderItemsSchema), OrderController.updateOrderItems);
adminRouter.put("/orders/:id/status", authAdmin, validateParams(getOrderByIdSchema), validateQuery(updateOrderStatusSchema), OrderController.updateOrderStatus);
adminRouter.delete("/orders/:id", authAdmin, validateParams(getOrderByIdSchema), OrderController.deleteOrder);
adminRouter.get("/orders/:id", authAdmin, validateParams(getOrderByIdSchema), OrderController.getOrderDetails);


export default adminRouter;