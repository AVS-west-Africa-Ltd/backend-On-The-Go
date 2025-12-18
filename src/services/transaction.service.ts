import db from '../models';
import { Op } from 'sequelize';
import { Order } from '../models/Order';
import { Transaction } from '../models/Transaction';
import { OrderItem } from '../models/OrderItem';
import { Profile } from '../models/Profile';
import { IGetTransactions } from '../interfaces/transaction.interface';
import { Product } from '../models/Product';
import { BranchAmenity } from '../models/BranchAmenity';
import { Amenity } from '../models/Amenity';

export class TransactionService {

    static async getTransactions(filters: IGetTransactions, profileId: number) {
        const {
            status,
            paymentMethod,
            from,
            to,
            businessId,
            branchId,
            cursor,
            search,
            limit = 10
        } = filters;

        const whereClause: any = {};

        if (status) whereClause.status = status;
        if (paymentMethod) whereClause.paymentMethod = paymentMethod;
        if (profileId) whereClause.customerId = profileId;
        if (businessId) whereClause.businessId = businessId;
        if (branchId) whereClause.branchId = branchId;

        if (from && to) {
            const startDate = new Date(from);
            const endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            whereClause.createdAt = {
                [Op.between]: [startDate, endDate]
            };
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

        if (search) {
            whereClause.orderId = {
                [Op.like]: `%${search}%`
            };
        }

        const transactions = await Transaction.findAll({
            where: whereClause,
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: ['id', 'orderId', 'totalAmount', 'status']
                }
            ],
            limit: Number(limit) + 1,
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });

        let nextCursor: string | null = null;
        const hasNextPage = transactions.length > Number(limit);

        if (hasNextPage) {
            transactions.pop();
            const lastTransaction = transactions[transactions.length - 1];
            if (lastTransaction) {
                nextCursor = `${lastTransaction.createdAt.toISOString()}_${lastTransaction.id}`;
            }
        }

        return {
            transactions,
            total: transactions.length, // Total for this page
            nextCursor,
            hasNextPage
        };
    }


    static async getTransactionById(id: string, profileId: number) {
        const transaction = await Transaction.findOne({
            where: {
                id: id,
                customerId: profileId,
            },
            include: [
                {
                    model: Order,
                    as: "order",
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
                                                    attributes: ["id", "name"],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    model: Profile,
                    as: "customer",
                    attributes: ["id", "userName"],
                },
                { model: Profile, as: "business", attributes: ["id", "userName"] },
            ],
        });

        if (!transaction) {
            throw new Error("Transaction not found");
        }

        return transaction;
    }
}
