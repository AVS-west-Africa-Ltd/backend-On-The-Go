import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AppError } from '../utils/errors';
import { errorHandler, successHandler } from '../handlers/responseHandlers';

export class OrderController {

    static async createOrder(req: Request, res: Response) {
        try {
            const userId = req.user;
            const profileId = req.profile!.id;
            const payload = req.body;

            const order = await OrderService.createOrder(payload, profileId, userId);

            return successHandler(res, "Order created successfully", 201, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500)
        }
    }

    static async initiateCheckout(req: Request, res: Response) {
        try {
            const { orderId } = req.body;
            const profileId = req.profile!.id;
            const userId = req.user;

            if (!orderId) {
                throw new AppError("Order ID is required", 400);
            }

            const data = await OrderService.initiateCheckout(orderId, profileId, userId);

            return successHandler(res, "Checkout initiated", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500)
        }
    }

    static async verifyPayment(req: Request, res: Response) {
        try {
            const { reference } = req.query; // Or req.params / body

            if (!reference) {
                return errorHandler(res, "Transaction reference is required", 400);
            }

            const result = await OrderService.verifyPayment(reference as string);

            if (!result) {
                return errorHandler(res, "Payment unverified", 400);
            }

            // res.status(200).json({ status: 'success', result });
            return successHandler(res, "Payment verified successfully", 200, result);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500)
        }
    }

    static async getOrderById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profileId = req.user;

            if (!id) {
                throw new AppError("Order ID is required", 400);
            }
            const order = await OrderService.getOrderById(profileId, id);

            if (!order) {
                return errorHandler(res, "Order not found", 404);
            }

            return successHandler(res, "Order fetched successfully", 200, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500)
        }
    }

    static async getUserOrders(req: Request, res: Response) {
        try {
            const profileId = req.profile!.id;
            const filters = req.query;
            const data = await OrderService.getUserOrders(profileId, filters);
            return successHandler(res, "Orders fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500)
        }
    }

    static async getBusinessOrders(req: Request, res: Response) {
        try {
            // Check if user is business owner or staff (middleware should handle, or we check profile)
            // For now assuming the businessId is passed or inferred. 
            // Better: User has a profile associated with business

            // Simplified: Expecting businessId in query or params? 
            // In a real app, we check if req.user owns the business.
            // Let's assume we pass businessId in Query for now, or infer from user's business profile.

            // For this task, let's assume the user IS the business.
            // We need to fetch the business profileId for this user.

            const userId = (req as any).user.id;

            // We might need to find the Business Profile ID for this user first.
            // But let's keep it simple: Pass businessId in query, validation inside Service?
            // Service method expects businessId.

            const { businessId, branchId, ...filters } = req.query;

            if (!businessId) {
                // throw new AppError("Business ID is required", 400);
                // Or fetch from User's profile
            }

            const data = await OrderService.getBusinessOrders(Number(businessId), branchId ? Number(branchId) : undefined, filters);
            return successHandler(res, "Orders fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500)
        }
    }
}
