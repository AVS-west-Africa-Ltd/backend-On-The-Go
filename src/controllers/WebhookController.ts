import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { OrderService } from '../services/order.service';
import { AppError } from '../utils/errors';
import { appEvents } from '../utils/events';
import { errorHandler, successHandler } from '../handlers/responseHandlers';
import { PAYMENT_EVENT } from '../subscribers/types';

export class WebhookController {

    static async handlePaystackWebhook(req: Request, res: Response) {
        try {
            const signature = req.headers['x-paystack-signature'] as string;

            if (!signature) {
                // If no signature, it's not from Paystack
                throw new AppError("No signature provided", 401);
            }

            const isValid = PaymentService.verifySignature(signature, req.body);

            if (!isValid) {
                throw new AppError("Invalid signature", 401);
            }

            // Parse body for downstream usage (since it's raw buffer now)
            const eventData = JSON.parse(req.body.toString());

            // Emit Event for background processing
            appEvents.emit(PAYMENT_EVENT.PAYSTACK_WEBHOOK, eventData);

            // Always return 200 OK to Paystack immediately
            return successHandler(res, "Webhook received", 200);
        } catch (error: any) {
            console.error("Webhook Error:", error);
            return errorHandler(res, error.message || 'Webhook Error', error.status || 500)
        }
    }
}
