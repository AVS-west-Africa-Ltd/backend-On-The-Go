import express from "express";
import {
    createAdmin,
    getAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    updateRole,
    updatePermissions,
    getAllPermissions,
    getAllRoles,
    login
} from "../controllers/admin.controller";
import { authAdmin, authorizeAdmin } from "../middlewares/authAdmin";
import { authProfile } from "../middlewares/authProfile";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import {
    createAdminSchema,
    updateAdminSchema,
    updateRoleSchema,
    updatePermissionsSchema,
    loginAdminSchema
} from "../validators/admin.validator";
import { AdminPermission } from "../models/types/admin.types";

const router = express.Router();

// Public route to get all available permissions (for UI dropdowns, etc.)
// These have been moved to src/routes/admin/index.ts to avoid /staff prefix

// All admin management routes require standard profile auth first, 
// then specific admin auth, and then granular permission checks.
router.use(authAdmin);

router.post(
    "/create",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    validateBody(createAdminSchema),
    createAdmin
);

router.get(
    "/",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    getAdmins
);

router.get(
    "/:id",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    getAdminById
);

router.patch(
    "/:id",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    validateBody(updateAdminSchema),
    updateAdmin
);

router.delete(
    "/:id",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    deleteAdmin
);

router.patch(
    "/:id/role",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    validateBody(updateRoleSchema),
    updateRole
);

router.patch(
    "/:id/permissions",
    authorizeAdmin(AdminPermission.MANAGE_STAFF),
    validateBody(updatePermissionsSchema),
    updatePermissions
);

export default router;
