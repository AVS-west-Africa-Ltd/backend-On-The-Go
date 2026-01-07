import Joi from "joi";

export const getTransactionsSchema = Joi.object({
    status: Joi.string().valid('pending', 'success', 'failed', 'refunded').optional(),
    paymentMethod: Joi.string().valid('card', 'bank_transfer', 'bank', 'ussd').optional(),
    businessId: Joi.string().optional(),
    branchId: Joi.string().optional(),
    cursor: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional(),
    from: Joi.string().isoDate().optional(),
    to: Joi.string().isoDate().optional()
});

export const getTransactionByIdSchema = Joi.object({
    id: Joi.string().required()
});
