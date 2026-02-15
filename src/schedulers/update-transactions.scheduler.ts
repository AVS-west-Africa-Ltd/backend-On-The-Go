import cron from "node-cron";
import { Op } from "sequelize";
import { Transaction } from "../models/transaction.model";
import { Order } from "../models/order.model";
import { OrderItem } from "../models/orderItem.model";
import { Product } from "../models/product.model";
import { OrderPaymentStatus, OrderStatus } from "../models/types/order.types";
import { PaymentProvider, TPaymentMethod, TransactionStatus } from "../models/types/transaction.types";
import { PaymentService } from "../services/payment.service";
import { MikrotikService } from "../services/mikrotik.service";

const PAYMENT_TIMEOUT_MINUTES = 45;

export const verifyPendingTransactionsCron = () => {
    cron.schedule("0 * * * *", async () => {
        console.log("🕒 Running pending paystack transaction verification job...");

        const timeoutDate = new Date(
            Date.now() - PAYMENT_TIMEOUT_MINUTES * 60 * 1000
        );

        const pendingTransactions = await Transaction.findAll({
            where: {
                status: TransactionStatus.PENDING,
                provider: PaymentProvider.PAYSTACK,
                createdAt: { [Op.lt]: timeoutDate }
            }
        });

        for (const transaction of pendingTransactions) {
            try {
                const paystackData = await PaymentService.verifyTransaction(
                    transaction.provider_reference
                );

                if (paystackData.status === "success") {
                    await transaction.update({
                        status: TransactionStatus.SUCCESS,
                        paymentMethod: paystackData.channel as TPaymentMethod,
                        meta: paystackData
                    });

                    await Order.update(
                        {
                            paymentStatus: OrderPaymentStatus.PAID,
                            status: OrderStatus.ONGOING
                        },
                        { where: { id: transaction.orderId } }
                    );

                    console.log(`✅ Transaction ${transaction.reference} marked SUCCESS`);
                } else {
                    await transaction.update({
                        status: TransactionStatus.FAILED,
                        meta: paystackData
                    });

                    await Order.update(
                        {
                            paymentStatus: OrderPaymentStatus.FAILED,
                            status: OrderStatus.CANCELLED
                        },
                        { where: { id: transaction.orderId } }
                    );

                    console.log(`❌ Transaction ${transaction.reference} marked FAILED`);
                }
            } catch (error) {
                console.error(
                    `⚠️ Verification failed for ${transaction.reference}`,
                    error
                );
            }
        }
    });
};

export const processWifiTicketOrdersCron = () => {
    cron.schedule("* * * * *", async () => {
        console.log("🕒 Running wifi ticket order items cron job...");

        const pendingItems = await OrderItem.findAll({
            where: {
                isWifiTicket: true,
                ticketActivated: false,
            },
            include: [
                {
                    model: Order,
                    as: "order",
                    required: true,
                    where: {
                        paymentStatus: OrderPaymentStatus.PAID,
                    },
                },
                {
                    model: Product,
                    as: "product",
                    required: true,
                },
            ],
            limit: 100,
        });

        for (const item of pendingItems) {
            const product = item.product;
            const order = item.order;

            if (!product || !order) {
                continue;
            }

            const productMeta = (product.meta || {}) as any;

            if (!productMeta || productMeta.type !== "ticket_profile") {
                continue;
            }

            const payload: Record<string, unknown> = {
                orderItemId: item.id,
                orderId: order.id,
                customerId: order.customerId,
                businessId: order.businessId,
                branchId: order.branchId,
                ticketProfileId: productMeta.ticketProfileId,
                routerId: productMeta.routerId,
                bandwidth: productMeta.bandwidth,
                owner: productMeta.owner,
            };

            try {
                const result = await MikrotikService.createAndActivateTicket(payload);
                const currentMeta = (item.meta || {}) as any;

                await item.update({
                    ticketActivated: true,
                    meta: {
                        ...currentMeta,
                        wifiTicketActivation: {
                            payload,
                            result,
                        },
                    },
                });

                console.log(`✅ Activated wifi ticket for order item ${item.id}`);
            } catch (error) {
                console.error(
                    `⚠️ Failed to activate wifi ticket for order item ${item.id}`,
                    error
                );
            }
        }
    });
};
