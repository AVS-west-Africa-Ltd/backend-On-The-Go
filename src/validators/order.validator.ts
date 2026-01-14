import Joi from "joi";
import { OrderStatus } from "../models/types/order.types";

export const createOrderSchema = Joi.object({
    businessId: Joi.number().integer().positive().required(),
    branchId: Joi.number().integer().positive().required(),
    items: Joi.array().items(Joi.object({
        productId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().min(1).required()
    })).min(1).required(),
    voucherId: Joi.number().integer().positive().optional(),
});

export const initiateCheckoutSchema = Joi.object({
    orderId: Joi.string().required()
});

export const verifyPaymentSchema = Joi.object({
    reference: Joi.string().required()
});

export const getOrderByIdSchema = Joi.object({
    id: Joi.string().required()
});

export const getUserOrdersSchema = Joi.object({
    status: Joi.string().optional().valid(...Object.values(OrderStatus)),
    search: Joi.string().optional(),
    branchId: Joi.number().integer().positive().optional(),
    businessId: Joi.number().integer().positive().optional(),
    owner: Joi.number().integer().positive().optional(),
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    from: Joi.string().isoDate().optional(),
    to: Joi.string().isoDate().optional(),
});

export const getBranchOrdersSchema = Joi.object({
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    search: Joi.string().optional(),
    branchId: Joi.number().integer().positive().optional(),
    from: Joi.string().isoDate().optional(),
    to: Joi.string().isoDate().optional(),
    orderStatus: Joi.string().optional().valid(...Object.values(OrderStatus)),
});

export const updateOrderItemsSchema = Joi.object({
    items: Joi.array().items(Joi.object({
        productId: Joi.number().integer().positive().required(),
        quantity: Joi.number().integer().positive().min(1).required()
    })).min(1).required()
});

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string().required().valid(...Object.values(OrderStatus)),
});