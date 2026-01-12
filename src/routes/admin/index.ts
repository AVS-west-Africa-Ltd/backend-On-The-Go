import express from "express";
import analyticsRoutes from "../analytics.routes";
import branchRoutes from "../branch.routes";
import adminManagementRoutes from "../admin.routes";
import productRoutes from "../product.routes";
import { login, getAllPermissions, getAllRoles } from "../../controllers/AdminController";
import { validateBody } from "../../middlewares/validateMiddleware";
import { loginAdminSchema } from "../../validators/admin.validator";

const adminRouter = express.Router();

adminRouter.use("/analytics", analyticsRoutes);
adminRouter.use("/branches", branchRoutes);
adminRouter.use("/products", productRoutes);

// Public Admin Routes (No prefix)
adminRouter.post("/login", validateBody(loginAdminSchema), login);
adminRouter.get("/permissions", getAllPermissions);
adminRouter.get("/roles", getAllRoles);

// Management Routes (With prefix)
adminRouter.use("/staff", adminManagementRoutes);

export default adminRouter;