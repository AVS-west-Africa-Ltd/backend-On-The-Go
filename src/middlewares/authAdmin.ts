import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../handlers/responseHandlers';
import * as jwtUtil from '../utils/jwtUtil';
import { AdminRole, AdminPermission } from '../models/types/admin.types';

export const authAdmin = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorHandler(res, 'Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtUtil.verifyToken(token);

    if (!decoded) {
        return errorHandler(res, 'Invalid token', 401);
    }

    if (!decoded.admin) {
        return errorHandler(res, 'Access denied. Admin only.', 403);
    }

    req.admin = decoded.admin;
    req.user = decoded.user;
    req.profile = decoded.profile;
    req.branch = decoded.branch!;
    next();
};

export const authorizeAdmin = (requiredPermission: AdminPermission) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const admin = req.admin;

        if (!admin) {
            return errorHandler(res, 'Access denied. Admin info missing.', 403);
        }

        // SUPER_ADMIN bypasses all checks
        if (admin.role === AdminRole.SUPER_ADMIN) {
            return next();
        }

        const permissions = admin.permissions || [];
        if (!permissions.includes(requiredPermission)) {
            return errorHandler(res, `Access denied. Missing required permission: ${requiredPermission}`, 403);
        }

        next();
    };
};

export const authorizeSystemAdmin = (req: Request, res: Response, next: NextFunction) => {
    const admin = req.admin;

    if (!admin) {
        return errorHandler(res, 'Access denied. Admin info missing.', 403);
    }

    // Must be either SYSTEM_OWNER or SYSTEM_ADMIN
    const allowedRoles: AdminRole[] = [AdminRole.SYSTEM_OWNER, AdminRole.SYSTEM_ADMIN];

    if (!allowedRoles.includes(admin.role)) {
        return errorHandler(res, 'Access denied!', 403);
    }

    // Platform admins should not be bound to a specific business or branch in the system context
    if (admin.businessId || admin.branchId) {
        return errorHandler(res, 'Access denied!', 403);
    }

    next();
};
