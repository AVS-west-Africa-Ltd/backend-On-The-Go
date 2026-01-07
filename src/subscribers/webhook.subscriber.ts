import { appEvents } from '../utils/events';
import { OrderService } from '../services/order.service';
import { PAYMENT_EVENT } from '../subscribers/types';

export const registerWebhookListeners = () => {
    appEvents.on(PAYMENT_EVENT.PAYSTACK_WEBHOOK, async (data: any) => {
        try {
            console.log("Processing background webhook event...");
            await OrderService.processWebhookEvent(data);
        } catch (error) {
            console.error("Background Webhook Error:", error);
        }
    });
};
