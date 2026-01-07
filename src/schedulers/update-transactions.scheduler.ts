import cron from "node-cron";
import { Op } from "sequelize";
import { Transaction } from "../models/Transaction";
import { Order } from "../models/Order";
import { OrderPaymentStatus, OrderStatus } from "../models/types/order.types";
import { PaymentProvider, TPaymentMethod, TransactionStatus } from "../models/types/transaction.types";
import { PaymentService } from "../services/payment.service";

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
