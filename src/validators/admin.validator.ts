import Joi from "joi";
import { AdminRole, AdminPermission } from "../models/types/admin.types";

export const loginAdminSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

export const createAdminSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(...Object.values(AdminRole)).required(),
    branchId: Joi.number().required(),
    permissions: Joi.array().items(Joi.string().valid(...Object.values(AdminPermission))).optional(),
});

export const updateAdminSchema = Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    branchId: Joi.number().optional(),
});

export const updateRoleSchema = Joi.object({
    role: Joi.string().valid(...Object.values(AdminRole)).required(),
});

export const updatePermissionsSchema = Joi.object({
    permissions: Joi.array().items(Joi.string().valid(...Object.values(AdminPermission))).required(),
});
