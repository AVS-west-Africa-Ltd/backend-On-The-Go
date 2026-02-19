import db from '../models';
import { Op, WhereOptions } from 'sequelize';
import { PaymentService } from './payment.service';
import { ICreateOrderPayload, ICheckoutResponse, IGetUserOrdersPayload, IOrderSummary, IGetBranchOrdersPayload, IOrderItemPayload, IUpdateOrderPayload } from '../interfaces/order.interface';
import { randomCharacters, applyDateFilter } from '../utils/helpers';
import { AppError } from '../utils/errors';
import { OrderItem } from '../models/orderItem.model';
import { Product } from '../models/product.model';
import { Voucher } from '../models/voucher.model';
import { Order } from '../models/order.model';
import { Transaction } from '../models/transaction.model';
import { Branch } from '../models/branch.model';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { OrderPaymentStatus, OrderStatus, TOrderStatus } from '../models/types/order.types';
import { PaymentMethod, PaymentProvider, TransactionStatus, TPaymentMethod } from '../models/types/transaction.types';
import { PAYSTACK_EVENT, TPaystackEventData } from '../subscribers/types';
import { BranchAmenity } from '../models/branchAmenity.model';
import { Amenity } from '../models/amenity.model';
import { BranchService } from './branches.service';
import { VoucherType, VoucherStatus, RewardTriggerType } from '../models/types/rewardRules.types';
import { RewardService } from './reward.service';

const { sequelize } = db;

export class OrderService {

    static async createOrder(payload: ICreateOrderPayload, profileId: number, userId: number) {
        const t = await sequelize.transaction();

        try {
            const { businessId, branchId, items, voucherId } = payload;

            if (businessId && branchId) {
                const branchExist = await Branch.findOne({ where: { id: branchId, profileId: businessId } });
                if (!branchExist) {
                    throw new AppError("Branch not found", 404);
                }
            }

            let subTotal = 0;
            const orderItemsData: any[] = [];
            const orderAmenitiesCategorySet = new Set<string>();

            for (const item of items) {
                const product = await Product.findByPk(item.productId,
                    {
                        include: [
                            {
                                model: BranchAmenity,
                                as: "branch_amenity",
                                include: [
                                    {
                                        model: Amenity,
                                        as: "amenity",
                                        attributes: ["id", "name"]
                                    }
                                ]
                            }
                        ]
                    }
                );
                if (!product) {
                    throw new AppError(`Product with ID ${item.productId} not found`, 404);
                }

                if (product.branchId !== branchId) {
                    throw new AppError(`Product ${product.name} does not belong to the specified branch`, 400);
                }

                const itemTotal = product.price * item.quantity;
                subTotal += itemTotal;

                orderItemsData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    amount: product.price,
                    totalAmount: itemTotal,
                    isWifiTicket: product.isWifiTicket,
                });

                if (product.branch_amenity?.amenity?.name) {
                    orderAmenitiesCategorySet.add(product.branch_amenity.amenity.name);
                }
            }

            let discountAmount = 0;
            let appliedVoucherCode = null;

            if (voucherId) {
                const voucher = await Voucher.findOne({
                    where: { id: voucherId, userId },
                    lock: t.LOCK.UPDATE, // Lock for update to prevent race conditions
                    transaction: t
                });

                if (!voucher) {
                    throw new AppError("Invalid voucher code", 400);
                }

                if (voucher.status !== VoucherStatus.UNUSED) {
                    throw new AppError("Voucher has already been used or expired", 400);
                }

                if (new Date() > voucher.validUntil) {
                    await voucher.update(
                        { status: VoucherStatus.EXPIRED },
                        { transaction: t }
                    );
                    throw new AppError("Voucher has expired", 400);
                }

                if (voucher.businessId !== businessId) {
                    throw new AppError("Voucher is not valid for this business", 400);
                }

                if (voucher.minOrderAmount && subTotal < voucher.minOrderAmount) {
                    throw new AppError(`Minimum order amount for this voucher is ${voucher.minOrderAmount}`, 400);
                }

                if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
                    throw new AppError("Voucher usage limit reached", 400);
                }

                if (voucher.voucherType === VoucherType.PERCENTAGE_DISCOUNT) {
                    discountAmount = (subTotal * voucher.value) / 100;
                    if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
                        discountAmount = voucher.maxDiscountAmount;
                    }
                } else if (voucher.voucherType === VoucherType.FIXED_DISCOUNT) {
                    discountAmount = voucher.value;
                }

                if (discountAmount > subTotal) {
                    discountAmount = subTotal;
                }

                appliedVoucherCode = voucher.code;

                // Update usedCount and check status
                const newUsedCount = voucher.usedCount + 1;

                await voucher.update({
                    usedCount: newUsedCount,
                    status: VoucherStatus.USED
                }, { transaction: t });
            }

            const totalAmount = subTotal - discountAmount;

            const orderId = `ORD-${randomCharacters(8).toUpperCase()}`;

            const order = await Order.create({
                orderId,
                customerId: profileId,
                businessId,
                branchId,
                subTotal,
                discountAmount,
                totalAmount: totalAmount > 0 ? totalAmount : 0,
                voucherId,
                voucherCode: appliedVoucherCode,
                status: 'new',
                paymentStatus: 'pending',
                amenitiesCategory: Array.from(orderAmenitiesCategorySet),
            }, { transaction: t });

            const itemsToCreate = orderItemsData.map(item => ({
                ...item,
                orderId: order.id
            }));

            await OrderItem.bulkCreate(itemsToCreate, { transaction: t });

            await t.commit();
            return order;

        } catch (error) {
            console.error("Failed to create order:--", error);
            await t.rollback();
            throw error;
        }
    }

    static async updateOrderItems(payload: IUpdateOrderPayload) {
        const { profileId, userId, branchId, orderId, items } = payload;
        const t = await sequelize.transaction();
        try {
            const order = await Order.findOne({
                where: { id: orderId, branchId: branchId },
                transaction: t
            });

            if (!order) {
                throw new AppError("Order not found", 404);
            }

            const checkAccess = await BranchService.checkAccess({ profileId, userId, branchId: order.branchId });

            if (!checkAccess) {
                throw new AppError("You do not have access to this branch", 403);
            }

            if (order.status !== OrderStatus.NEW) {
                throw new AppError("Cannot update items for an ongoing or completed order", 400);
            }

            if (order.paymentStatus !== OrderPaymentStatus.PENDING) {
                throw new AppError("Cannot update items for a paid order", 400);
            }

            let subTotal = 0;
            const orderItemsData: any[] = [];
            const orderAmenitiesCategorySet = new Set<string>();

            for (const item of items) {
                const product = await Product.findByPk(item.productId,
                    {
                        include: [
                            {
                                model: BranchAmenity,
                                as: "branch_amenity",
                                include: [
                                    {
                                        model: Amenity,
                                        as: "amenity",
                                        attributes: ["id", "name"]
                                    }
                                ]
                            }
                        ],
                        transaction: t
                    }
                );
                if (!product) {
                    throw new AppError(`Product with ID ${item.productId} not found`, 404);
                }

                if (product.branchId !== order.branchId) {
                    throw new AppError(`Product ${product.name} does not belong to the order's branch`, 400);
                }

                const itemTotal = product.price * item.quantity;
                subTotal += itemTotal;

                orderItemsData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    amount: product.price,
                    totalAmount: itemTotal,
                    orderId: order.id,
                    isWifiTicket: product.isWifiTicket,
                });

                if (product.branch_amenity?.amenity?.name) {
                    orderAmenitiesCategorySet.add(product.branch_amenity.amenity.name);
                }
            }

            let discountAmount = 0;
            if (order.voucherId) {
                const voucher = await Voucher.findByPk(order.voucherId, { transaction: t });

                if (voucher) {
                    if (voucher.voucherType === VoucherType.PERCENTAGE_DISCOUNT) {
                        discountAmount = (subTotal * voucher.value) / 100;
                        if (voucher.maxDiscountAmount && discountAmount > voucher.maxDiscountAmount) {
                            discountAmount = voucher.maxDiscountAmount;
                        }
                    } else if (voucher.voucherType === VoucherType.FIXED_DISCOUNT) {
                        discountAmount = voucher.value;
                    }
                }
            }

            if (discountAmount > subTotal) {
                discountAmount = subTotal;
            }

            const totalAmount = subTotal - discountAmount;

            // Delete old items
            await OrderItem.destroy({ where: { orderId: order.id }, transaction: t });

            // Create new items
            await OrderItem.bulkCreate(orderItemsData, { transaction: t });

            // Update Order
            await order.update({
                subTotal,
                discountAmount,
                totalAmount: totalAmount > 0 ? totalAmount : 0,
                amenitiesCategory: Array.from(orderAmenitiesCategorySet)
            }, { transaction: t });

            await t.commit();
            return order;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getUserOrders(profileId: number, filters: IGetUserOrdersPayload) {
        const { status, cursor, from, to, branchId, businessId, limit = 10, search } = filters;

        const whereClause: WhereOptions<Order> = {
            customerId: profileId,
        };
        if (status) {
            whereClause.status = status;
        }

        const dateFilter = applyDateFilter(from, to);
        if (dateFilter) {
            whereClause.createdAt = dateFilter;
        }

        if (branchId) {
            whereClause.branchId = branchId;
        }

        if (businessId) {
            whereClause.businessId = businessId;
        }

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            (whereClause as any)[Op.or] = [
                { createdAt: { [Op.lt]: lastCreatedAt } },
                {
                    createdAt: lastCreatedAt,
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        if (search) {
            whereClause.orderId = {
                [Op.like]: `%${search}%`
            };
        }

        const orders = await Order.findAll({
            where: whereClause,
            limit: Number(limit) + 1,
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });

        let nextCursor: string | null = null;
        const hasNextPage = orders.length > Number(limit);

        if (hasNextPage) {
            orders.pop();
            const lastOrder = orders[orders.length - 1];
            if (lastOrder) {
                nextCursor = `${lastOrder.createdAt.toISOString()}_${lastOrder.id}`;
            }
        }

        return {
            orders,
            total: orders.length,
            nextCursor,
            hasNextPage
        };
    }

    static async getOrderById(profileId: number, id: string): Promise<IOrderSummary> {
        try {
            const whereClause: WhereOptions<Order> = {
                customerId: profileId,
                id: id,
            };

            const order = await Order.findOne({
                where: whereClause,
                include: [
                    {
                        model: OrderItem,
                        as: "items",
                        include: [
                            {
                                model: Product,
                                as: "product",
                                include: [
                                    {
                                        model: BranchAmenity,
                                        as: "branch_amenity",
                                        include: [
                                            {
                                                model: Amenity,
                                                as: "amenity",
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        model: Branch,
                        as: "branch",
                        attributes: ["id", "name", "streetAddress", "city"],
                        required: true,
                    },
                ],
            });

            if (!order) {
                throw new AppError("Order not found", 404);
            }



            return {
                id: order.id,
                orderId: order.orderId,
                status: order.status,
                paymentStatus: order.paymentStatus,
                amounts: {
                    subTotal: order.subTotal,
                    discount: order.discountAmount,
                    total: order.totalAmount,
                },
                items: (order.items ?? []).map((item: OrderItem) => ({
                    id: item.id,
                    quantity: item.quantity,
                    amount: item.amount,
                    totalAmount: item.totalAmount,
                    product: {
                        id: item.product!.id,
                        name: item.product!.name,
                        description: item.product!.description,
                        price: item.product!.price,
                        currency: item.product!.currency,
                        amenity: {
                            id: item.product!.branch_amenity!.amenity.id,
                            name: item.product!.branch_amenity!.amenity.name,
                        },
                    },
                })),
                branch: {
                    id: order.branch!.id,
                    name: order.branch!.name,
                    streetAddress: order.branch!.streetAddress,
                    city: order.branch!.city,
                },
                createdAt: order.createdAt,
                amenitiesCategory: order.amenitiesCategory || [],
            };
        } catch (error) {
            console.error("Error fetching order details:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Failed to fetch order details");
        }
    }

    static async getBranchOrders(filters: IGetBranchOrdersPayload) {
        const { orderStatus, cursor, limit = 10, from, to, search, branchId, userId, profileId } = filters;

        const whereClause: any = { branchId };

        const checkAccess = await BranchService.checkAccess({ profileId, userId, branchId });

        if (!checkAccess) {
            throw new AppError("You do not have access to this branch", 403);
        }

        if (orderStatus) {
            whereClause.status = orderStatus;
        }

        if (search) {
            whereClause.orderId = {
                [Op.like]: `%${search}%`,
            };
        }

        const dateFilter = applyDateFilter(from, to);

        if (dateFilter) {
            whereClause.createdAt = dateFilter;
        }

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            whereClause[Op.or] = [
                { createdAt: { [Op.lt]: lastCreatedAt } },
                {
                    createdAt: lastCreatedAt,
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: OrderItem, as: "items" },
                {
                    model: Profile,
                    as: "customer",
                    attributes: ["id", "picture", "userName"],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "firstName", "lastName"],
                        },
                    ],
                },
            ],
            limit: Number(limit) + 1,
            order: [
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
        });

        let nextCursor: string | null = null;
        const hasNextPage = orders.length > Number(limit);

        if (hasNextPage) {
            orders.pop();
            const lastOrder = orders[orders.length - 1];
            if (lastOrder) {
                nextCursor = `${lastOrder.createdAt.toISOString()}_${lastOrder.id}`;
            }
        }

        return {
            orders,
            total: orders.length,
            nextCursor,
            hasNextPage
        };
    }

    static async getOrderDetails(orderId: string, profileId: number, userId: number, branchId: number) {
        const order = await Order.findOne({
            where: { id: orderId, branchId },
            include: [
                {
                    model: OrderItem, as: "items",
                    attributes: { exclude: ["createdAt", "updatedAt", "orderId", "productId"] },
                    include: [
                        {
                            model: Product, as: "product",
                            attributes: ["id", "name", "description", "price", "currency", "isFeatured"],
                            include: [
                                {
                                    model: BranchAmenity, as: "branch_amenity",
                                    attributes: ["id"],
                                    include: [
                                        {
                                            model: Amenity, as: "amenity",
                                            attributes: ["id", "name"],
                                        },
                                    ],
                                },
                            ],
                        },
                    ]
                },
                {
                    model: Profile,
                    as: "customer",
                    attributes: ["id", "picture", "userName"],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "firstName", "lastName"],
                        },
                    ],
                },
            ],
        });

        if (!order) {
            throw new AppError("Order not found", 404);
        }

        const checkAccess = await BranchService.checkAccess({ profileId, userId, branchId: order.branchId });

        if (!checkAccess) {
            throw new AppError("You do not have access to this branch", 403);
        }

        return order;
    }

    static async updateOrderStatus(orderId: string, status: TOrderStatus, profileId: number, userId: number, branchId: number) {

        const order = await Order.findByPk(orderId);

        if (!order) {
            throw new AppError("Order not found", 404);
        }

        const checkAccess = await BranchService.checkAccess({ profileId, userId, branchId: order.branchId });

        if (!checkAccess) {
            throw new AppError("You do not have access to this branch", 403);
        }


        if (order.status === status) {
            return order;
        }

        if (order.status === OrderStatus.ONGOING || order.status === OrderStatus.COMPLETED) {
            if (status === OrderStatus.NEW) {
                throw new AppError("Order status not allowed", 400);
            }
        }

        order.status = status;
        await order.save();

        return order;
    }

    static async deleteOrder(orderId: string, profileId: number, userId: number, branchId: number): Promise<boolean> {
        try {
            const order = await Order.findOne({ where: { id: orderId, branchId } });

            if (!order) {
                throw new AppError("Order not found", 404);
            }

            const checkAccess = await BranchService.checkAccess({ profileId, userId, branchId: order.branchId });

            if (!checkAccess) {
                throw new AppError("You do not have access to this branch", 403);
            }

            if (order.status !== OrderStatus.NEW) {
                throw new AppError("Cannot delete an ongoing or completed order", 400);
            }

            const transactionCount = await Transaction.count({ where: { orderId: order.id } });

            if (transactionCount > 0) {
                throw new AppError("Cannot delete order with associated payment transactions", 400);
            }

            await order.destroy();

            return true;
        } catch (error: any) {
            throw new AppError(error.message || "Failed to delete order", error.statusCode || 500);
        }
    }

    static async getBusinessOrders(businessId: number, branchId: number | undefined, filters: any = {}) {
        const { status, cursor, limit = 10, startDate, endDate, search } = filters;

        const whereClause: any = { businessId };

        if (branchId) {
            whereClause.branchId = branchId;
        }

        if (status) {
            whereClause.status = status;
        }

        if (search) {
            whereClause.orderId = {
                [Op.like]: `%${search}%`,
            };
        }

        const dateFilter = applyDateFilter(startDate, endDate);
        if (dateFilter) {
            whereClause.createdAt = dateFilter;
        }

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            whereClause[Op.or] = [
                { createdAt: { [Op.lt]: lastCreatedAt } },
                {
                    createdAt: lastCreatedAt,
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const orders = await Order.findAll({
            where: whereClause,
            include: [
                { model: OrderItem, as: 'items' },
                { model: Profile, as: 'customer', attributes: ['id', 'userId', 'firstName', 'lastName'] }
            ],
            limit: Number(limit) + 1,
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });

        let nextCursor: string | null = null;
        const hasNextPage = orders.length > Number(limit);

        if (hasNextPage) {
            orders.pop();
            const lastOrder = orders[orders.length - 1];
            if (lastOrder) {
                nextCursor = `${lastOrder.createdAt.toISOString()}_${lastOrder.id}`;
            }
        }

        return {
            orders,
            total: orders.length,
            nextCursor,
            hasNextPage
        };
    }

    static async initiateCheckout(orderId: string, profileId: number, userId: number): Promise<ICheckoutResponse> {
        try {
            const order = await Order.findOne({
                where: { id: orderId, customerId: profileId }
            });

            if (!order) {
                throw new AppError("Order not found", 404);
            }

            if (order.paymentStatus === 'paid') {
                throw new AppError("Order is already paid", 400);
            }

            const user = await User.findByPk(userId);
            if (!user) {
                throw new AppError("User not found", 404);
            }

            const reference = `TXN-${randomCharacters(25).toUpperCase()}`;

            const paystackData = await PaymentService.initializeTransaction(
                user.email,
                order.totalAmount,
                undefined,
                {
                    orderId: order.id,
                    transaction_reference: reference,
                    profileId: profileId,
                    userId: userId
                }
            );

            const orderTxn = await Transaction.findOne({
                where: { orderId: order.id },
            });

            if (orderTxn) {
                throw new AppError("Initialization already in progress", 400);
            }

            await Transaction.create({
                orderId: order.id,
                customerId: userId,
                businessId: order.businessId,
                branchId: order.branchId,
                amount: order.totalAmount,
                currency: 'NGN',
                // paymentMethod: PaymentMethod.CARD, // check this later!!!!! put null at first??
                reference: reference,
                provider_reference: paystackData.reference,
                provider: PaymentProvider.PAYSTACK,
                status: TransactionStatus.PENDING
            });

            return {
                paymentUrl: paystackData.authorization_url,
                reference: paystackData.reference,
                accessCode: paystackData.access_code
            };
        } catch (error) {
            console.error("Checkout initiation failed:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Failed to initiate checkout");
        }
    }

    static async verifyPayment(reference: string): Promise<boolean> {
        const t = await sequelize.transaction();

        try {
            const paystackData = await PaymentService.verifyTransaction(reference);

            const transaction = await Transaction.findOne({
                where: { provider_reference: reference },
                transaction: t
            });

            if (!transaction) {
                throw new AppError("Transaction record not found", 404);
            }

            if (transaction.status === TransactionStatus.SUCCESS) {
                await t.commit();
                return true;
            }

            if (paystackData.status === 'success') {
                await transaction.update({
                    status: TransactionStatus.SUCCESS,
                    paymentMethod: paystackData.channel as TPaymentMethod,
                    meta: {
                        customer_first_name: paystackData.customer.first_name,
                        customer_last_name: paystackData.customer.last_name,
                        customer_email: paystackData.customer.email,
                        customer_phone: paystackData.customer.phone,
                        customer_id: paystackData.customer.id,
                        customer_code: paystackData.customer.customer_code,
                    }
                }, { transaction: t });

                const order = await Order.findByPk(transaction.orderId, { transaction: t });
                if (order) {
                    await order.update({
                        status: OrderStatus.ONGOING,
                        paymentStatus: OrderPaymentStatus.PAID
                    }, { transaction: t });
                }

                await t.commit();
            }

            const FAILED_STATUSES = ['failed', 'abandoned'];

            if (FAILED_STATUSES.includes(paystackData.status)) {
                await transaction.update({
                    status: TransactionStatus.FAILED,
                    paymentMethod: paystackData.channel as TPaymentMethod,
                    meta: {
                        customer_first_name: paystackData.customer.first_name,
                        customer_last_name: paystackData.customer.last_name,
                        customer_email: paystackData.customer.email,
                        customer_phone: paystackData.customer.phone,
                        customer_id: paystackData.customer.id,
                        customer_code: paystackData.customer.customer_code,
                    }
                }, { transaction: t });

                await Order.update({
                    paymentStatus: OrderPaymentStatus.FAILED
                }, {
                    where: { id: transaction.orderId },
                    transaction: t
                });

                await t.commit();
                return false;
            }

            // pending / ongoing
            await transaction.update({
                status: TransactionStatus.PENDING,
                meta: paystackData
            }, { transaction: t });

            await t.commit();

            return false;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async processWebhookEvent(event: any) {
        if (event.event !== PAYSTACK_EVENT.CHARGE_SUCCESS) {
            return { ignored: true };
        }

        const data = event.data as TPaystackEventData;
        const reference = data.reference;

        const t = await sequelize.transaction();
        try {
            const transaction = await Transaction.findOne({
                where: { provider_reference: reference },
                transaction: t
            });

            if (!transaction) {
                console.warn(`Webhook: Transaction with ref ${reference} not found.`);
                await t.commit();
                return { success: true };
            }

            if (transaction.status === 'success') {
                await t.commit();
                return { success: true, message: "Already processed" };
            }

            await transaction.update({
                status: TransactionStatus.SUCCESS,
                paymentMethod: data.channel as TPaymentMethod,
                meta: {
                    customer_first_name: data.customer.first_name,
                    customer_last_name: data.customer.last_name,
                    customer_email: data.customer.email,
                    customer_phone: data.customer.phone,
                    customer_id: data.customer.id,
                    customer_code: data.customer.customer_code,
                }
            }, { transaction: t });

            const order = await Order.findByPk(transaction.orderId, { transaction: t });
            if (order) {
                await order.update({
                    status: OrderStatus.ONGOING,
                    paymentStatus: OrderPaymentStatus.PAID
                }, { transaction: t });

                // Trigger reward progress for CAMPAIGN or other relevant types
                // This is a placeholder for where you might trigger rewards based on order completion
                // For now, let's say we have a rule for every order if configured.
                // await RewardService.trackProgress({ userId: order.customerId, businessId: order.businessId, triggerType: RewardTriggerType.CAMPAIGN }, t);
            }

            await t.commit();
            console.log('Transaction processed successfully');

            return { success: true };

        } catch (error) {
            await t.rollback();
            console.error("Webhook Processing Error:", error);
            throw error;
        }
    }
}
