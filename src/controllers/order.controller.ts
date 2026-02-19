import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AppError } from '../utils/errors';
import { errorHandler, successHandler } from '../handlers/responseHandlers';
import { TOrderStatus } from '../models/types/order.types';
import { IGetUserOrdersPayload } from '../interfaces/order.interface';

export class OrderController {

    static async createOrder(req: Request, res: Response) {
        try {
            const userId = req.user;
            const profileId = req.profile!.id;
            const payload = req.body;

            const order = await OrderService.createOrder(payload, profileId, userId);

            return successHandler(res, "Order created successfully", 201, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
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
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }

    static async verifyPayment(req: Request, res: Response) {
        try {
            const { reference } = req.query; // Or req.params / body

            if (!reference) {
                return errorHandler(res, "Transaction reference is required", 400, null);
            }

            const result = await OrderService.verifyPayment(reference as string);

            if (!result) {
                return errorHandler(res, "Payment unverified", 400, null);
            }

            // res.status(200).json({ status: 'success', result });
            return successHandler(res, "Payment verified successfully", 200, result);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
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
                return errorHandler(res, "Order not found", 404, null);
            }

            return successHandler(res, "Order fetched successfully", 200, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }

    static async getUserOrders(req: Request, res: Response) {
        try {
            const profileId = req.profile!.id;
            const filters = req.query;
            const data = await OrderService.getUserOrders(profileId, filters);
            return successHandler(res, "Orders fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }

    static async getBranchOrders(req: Request, res: Response) {
        try {
            const { cursor, limit = "10", search, orderStatus, from, to } = req.query;

            const userId = req.user;
            const profileId = req.profile!.id;
            let branchIdd: number | undefined;

            if (req.query.branchId && !isNaN(Number(req.query.branchId))) {
                branchIdd = Number(req.query.branchId);
            } else {
                branchIdd = req.branch;
            }

            if (!branchIdd) {
                return errorHandler(res, "Access Denied", 403, null);
            }

            const data = await OrderService.getBranchOrders({
                cursor: cursor as string,
                limit: Number(limit),
                search: search as string,
                userId,
                profileId,
                branchId: branchIdd,
                orderStatus: orderStatus as TOrderStatus,
                from: from as string,
                to: to as string
            });
            return successHandler(res, "Orders fetched successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }

    static async getOrderDetails(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profileId = req.profile!.id;
            const userId = req.user;
            const branchId = req.branch!;

            const order = await OrderService.getOrderDetails(id, profileId, userId, branchId);

            return successHandler(res, "Order details fetched successfully", 200, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }


    static async updateOrderItems(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profileId = req.profile!.id;
            const { items } = req.body;

            const order = await OrderService.updateOrderItems({
                orderId: id,
                items,
                profileId,
                userId: req.user,
                branchId: req.branch!
            });

            return successHandler(res, "Order items updated successfully", 200, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }

    static async updateOrderStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profileId = req.profile!.id;
            const userId = req.user;
            const { status } = req.query;
            const branchId = req.branch!;

            const order = await OrderService.updateOrderStatus(id, status as TOrderStatus, profileId, userId, branchId);

            return successHandler(res, "Order status updated successfully", 200, order);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }

    static async deleteOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profileId = req.profile!.id;
            const userId = req.user;
            const branchId = req.branch!;

            await OrderService.deleteOrder(id, profileId, userId, branchId);

            return successHandler(res, "Order deleted successfully", 200);
        } catch (error: any) {
            return errorHandler(res, error.message || "Something went wrong please try again", error.status || 500, error)
        }
    }
}
