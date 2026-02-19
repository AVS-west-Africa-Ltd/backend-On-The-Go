import db from "../models";
import { Op, Transaction } from "sequelize";
import { BusinessRewardRules } from "../models/RewardRules";
import { Voucher } from "../models/Voucher";
import { UserRewardProgress } from "../models/UserRewardProgress";
import { RewardTriggerType, VoucherStatus } from "../models/types/rewardRules.types";
import { ICreateRewardRule, IManualIssueVoucher, IGetBranchVouchersParams, IGetRulesParams, IGetUserVouchersParams, IRedeemVoucherContext, ITrackProgressParams, IVoucherListResponse, IRewardRulesResponse } from "../interfaces/reward.interface";
import { AppError } from "../utils/errors";
import { randomCharacters } from "../utils/helpers";
import { Branch } from "../models/Branch";

const { sequelize } = db;

export class RewardService {
    static async createRule(data: ICreateRewardRule, transaction?: Transaction) {
        try {
            return await BusinessRewardRules.create({
                businessId: data.businessId,
                branchId: data.branchId ?? null,
                name: data.name ?? null,
                description: data.description ?? null,
                triggerType: data.triggerType,
                threshold: data.threshold,
                voucherType: data.voucherType,
                value: data.value,
                validityDays: data.validityDays,
                expiryHours: data.expiryHours ?? 24,
                maxPerUser: data.maxPerUser ?? 5,
                productId: data.productId ?? null,
                minOrderAmount: data.minOrderAmount ?? 0,
                maxDiscountAmount: data.maxDiscountAmount ?? null,
                isStackable: data.isStackable ?? false,
            } as any, { transaction });
        } catch (error: any) {
            console.error("RewardService.createRule Error:", error);
            throw new AppError(error.message || "Failed to create reward rule", 400);
        }
    }

    /**
     * Get rules for a business or branch with pagination
     */
    static async getRules(params: IGetRulesParams): Promise<IRewardRulesResponse> {
        try {
            const { businessId, branchId, cursor, limit = 10 } = params;
            const where: any = { businessId, isActive: true };
            if (branchId) {
                where[Op.or] = [{ branchId: null }, { branchId }];
            } else {
                where.branchId = null;
            }

            if (cursor) {
                const [createdAt, id] = cursor.split("_");
                (where as any)[Op.and] = [
                    ...(where[Op.and] || []),
                    {
                        [Op.or]: [
                            { createdAt: { [Op.lt]: createdAt } },
                            {
                                createdAt,
                                id: { [Op.lt]: id },
                            },
                        ]
                    }
                ];
            }

            const { count, rows: rules } = await BusinessRewardRules.findAndCountAll({
                where,
                order: [['createdAt', 'DESC'], ['id', 'DESC']],
                limit: limit + 1
            });

            let nextCursor: string | null = null;
            const hasNextPage = rules.length > limit;

            if (hasNextPage) {
                rules.pop();
                const last = rules[rules.length - 1];
                nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
            }

            return {
                rules,
                total: count,
                nextCursor
            };
        } catch (error: any) {
            console.error("RewardService.getRules Error:", error);
            throw new AppError("Failed to fetch reward rules", 400);
        }
    }

    static async trackProgress(params: ITrackProgressParams, transaction?: Transaction) {
        const { userId, businessId, triggerType, branchId } = params;
        const t = transaction || await sequelize.transaction();

        try {
            // 1. Find active rules for this trigger and business
            // Rules can be global (branchId is null) or specific to this branch
            const rules = await BusinessRewardRules.findAll({
                where: {
                    businessId,
                    triggerType,
                    isActive: true,
                    [Op.or]: [
                        { branchId: null },
                        { branchId: branchId || null }
                    ]
                },
                transaction: t
            });

            for (const rule of rules) {

                // Count vouchers by ruleId (CORRECT)
                const voucherCount = await Voucher.count({
                    where: {
                        userId,
                        ruleId: rule.id,
                        status: { [Op.ne]: VoucherStatus.CANCELLED }
                    },
                    transaction: t
                });

                if (voucherCount >= rule.maxPerUser) continue;

                const [progress] = await UserRewardProgress.findOrCreate({
                    where: {
                        userId,
                        businessId,
                        ruleId: rule.id
                    },
                    defaults: {
                        userId,
                        businessId,
                        ruleId: rule.id,
                        progress: 0,
                        threshold: rule.threshold
                    },
                    transaction: t,
                    lock: t.LOCK.UPDATE
                });

                progress.progress += 1;

                // Robustness: Sync threshold if rule changed
                if (progress.threshold !== rule.threshold) {
                    progress.threshold = rule.threshold;
                }

                // Safety: Avoid division by zero
                const effectiveThreshold = rule.threshold > 0 ? rule.threshold : 1;
                const rewardCount = Math.floor(progress.progress / effectiveThreshold);

                if (rewardCount > 0) {
                    for (let i = 0; i < rewardCount; i++) {
                        if (voucherCount + i >= rule.maxPerUser) break;
                        await this.issueVoucher(userId, rule, t);
                    }

                    progress.progress = progress.progress % effectiveThreshold;
                }

                await progress.save({ transaction: t });
            }

            if (!transaction) await t.commit();
        } catch (error: any) {
            if (!transaction) await t.rollback();
            console.error("RewardService.trackProgress Error:", error);
            throw new AppError(error.message || "Failed to track reward progress", 400);
        }
    }


    static async issueVoucher(
        userId: number,
        rule: BusinessRewardRules,
        transaction: Transaction
    ) {
        const validFrom = new Date();
        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + rule.expiryHours);

        // Robustness: Retry logic for unique code generation
        let code = "";
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            code = `VOU-${randomCharacters(8).toUpperCase()}`;
            const existing = await Voucher.findOne({ where: { code }, transaction });
            if (!existing) isUnique = true;
            attempts++;
        }

        return await Voucher.create({
            code,
            userId,
            businessId: rule.businessId,
            branchId: rule.branchId,
            ruleId: rule.id,
            description: rule.description,
            validityDays: rule.validityDays,
            voucherType: rule.voucherType,
            value: rule.value,
            productId: rule.productId,
            minOrderAmount: rule.minOrderAmount,
            maxDiscountAmount: rule.maxDiscountAmount,
            isStackable: rule.isStackable,
            status: VoucherStatus.UNUSED,
            validFrom,
            validUntil,
            usageLimit: 1,
            usedCount: 0
        } as any, { transaction });
    }

    static async getUserVouchers(params: IGetUserVouchersParams, transaction?: Transaction): Promise<IVoucherListResponse> {
        try {
            const { userId, branchId, cursor, limit = 10 } = params;
            const where: any = { userId };
            if (branchId) {
                where[Op.or] = [
                    { branchId: null },
                    { branchId: branchId }
                ];
            }

            if (cursor) {
                const [createdAt, id] = cursor.split("_");
                (where as any)[Op.and] = [
                    ...(where[Op.and] || []),
                    {
                        [Op.or]: [
                            { createdAt: { [Op.lt]: createdAt } },
                            {
                                createdAt,
                                id: { [Op.lt]: id },
                            },
                        ]
                    }
                ];
            }

            const { count, rows: vouchers } = await Voucher.findAndCountAll({
                where,
                include: [
                    {
                        model: BusinessRewardRules,
                        as: "rule",
                        attributes: ['name', 'description', 'value', 'voucherType', 'expiryHours', 'maxPerUser', 'threshold', 'triggerType', 'isActive', 'branchId']
                    },
                    {
                        model: Branch,
                        as: "branch",
                        attributes: ['name']
                    },
                    {
                        model: db.User,
                        as: "user",
                        attributes: ['firstName', 'lastName', 'email']
                    }
                ],
                order: [['createdAt', 'DESC'], ['id', 'DESC']],
                limit: limit + 1,
                transaction
            });

            let nextCursor: string | null = null;
            const hasNextPage = vouchers.length > limit;

            if (hasNextPage) {
                vouchers.pop();
                const last = vouchers[vouchers.length - 1];
                nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
            }

            return {
                vouchers,
                total: count,
                nextCursor
            };
        } catch (error: any) {
            console.error("RewardService.getUserVouchers Error:", error);
            throw new AppError("Failed to fetch vouchers", 400);
        }
    }

    /**
     * Get vouchers for a branch with status filtering and search
     */
    static async getBranchVouchers(params: IGetBranchVouchersParams): Promise<IVoucherListResponse> {
        try {
            const { branchId, status, search, cursor, limit = 10 } = params;
            const where: any = { branchId };
            if (status) {
                where.status = status;
            }
            if (search) {
                where.code = { [Op.like]: `%${search}%` };
            }

            if (cursor) {
                const [createdAt, id] = cursor.split("_");
                (where as any)[Op.and] = [
                    ...(where[Op.and] || []),
                    {
                        [Op.or]: [
                            { createdAt: { [Op.lt]: createdAt } },
                            {
                                createdAt,
                                id: { [Op.lt]: id },
                            },
                        ]
                    }
                ];
            }

            const { count, rows: vouchers } = await Voucher.findAndCountAll({
                where,
                include: [
                    {
                        model: db.User,
                        as: "user",
                        attributes: ['firstName', 'lastName', 'email']
                    },
                    {
                        model: BusinessRewardRules,
                        as: "rule",
                        attributes: ['name', 'description', 'value', 'voucherType', 'expiryHours', 'maxPerUser', 'threshold', 'triggerType', 'isActive', 'branchId']
                    }
                ],
                order: [['createdAt', 'DESC'], ['id', 'DESC']],
                limit: limit + 1
            });

            let nextCursor: string | null = null;
            const hasNextPage = vouchers.length > limit;

            if (hasNextPage) {
                vouchers.pop();
                const last = vouchers[vouchers.length - 1];
                nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
            }

            return {
                vouchers,
                total: count,
                nextCursor
            };
        } catch (error: any) {
            console.error("RewardService.getBranchVouchers Error:", error);
            throw new AppError("Failed to fetch branch vouchers", 400);
        }
    }

    /**
     * Manually issue a voucher to a user
     */
    static async manualIssueVoucher(data: IManualIssueVoucher) {
        try {
            const validFrom = new Date();
            const validUntil = new Date();
            validUntil.setHours(validUntil.getHours() + data.expiryHours);

            const code = `VOU-${randomCharacters(8).toUpperCase()}`;

            return await Voucher.create({
                code,
                userId: data.userId,
                businessId: data.businessId,
                branchId: data.branchId ?? null,
                voucherType: data.voucherType,
                value: data.value,
                description: data.description ?? null,
                validityDays: data.validityDays,
                productId: data.productId ?? null,
                minOrderAmount: data.minOrderAmount ?? 0,
                maxDiscountAmount: data.maxDiscountAmount ?? null,
                isStackable: data.isStackable ?? false,
                status: VoucherStatus.UNUSED,
                validFrom,
                validUntil,
                usageLimit: 1,
                usedCount: 0
            } as any);
        } catch (error: any) {
            console.error("RewardService.manualIssueVoucher Error:", error);
            throw new AppError(error.message || "Failed to issue voucher", 400);
        }
    }

    /**
     * Redeem a voucher with context validation
     */
    static async redeemVoucher(
        params: {
            voucherId: number;
            userId: number;
            context?: IRedeemVoucherContext;
        },
        transaction?: Transaction
    ) {
        try {
            const { voucherId, userId, context } = params;
            const voucher = await Voucher.findOne({
                where: { id: voucherId, userId },
                transaction
            });

            if (!voucher) throw new AppError("Voucher not found", 404);
            if (voucher.status !== VoucherStatus.UNUSED) throw new AppError("Voucher is not valid or already used", 400);
            if (new Date() > voucher.validUntil) throw new AppError("Voucher has expired", 400);

            // 1. Minimum Spend Check
            if (context?.orderSubtotal !== undefined && context.orderSubtotal < (voucher.minOrderAmount || 0)) {
                throw new AppError(`Minimum spend of ${voucher.minOrderAmount} required for this voucher.`, 400);
            }

            // 2. Product-Specific Check
            if (voucher.productId && context?.items) {
                const hasProduct = context.items.some(item => Number(item.productId) === Number(voucher.productId));
                if (!hasProduct) {
                    throw new AppError("Voucher is only valid for a specific product not found in your order.", 400);
                }
            }

            // 3. Stackability Check
            if (context?.appliedVoucherIds && context.appliedVoucherIds.length > 0) {
                // If the current voucher is NOT stackable, it cannot be added to existing ones
                if (!voucher.isStackable) {
                    throw new AppError("This voucher cannot be used with other vouchers.", 400);
                }

                // If there are already vouchers, we must check if any of THEM are non-stackable
                const otherVouchers = await Voucher.findAll({
                    where: { id: { [Op.in]: context.appliedVoucherIds } },
                    transaction
                });

                if (otherVouchers.some(v => !v.isStackable)) {
                    throw new AppError("One of the already applied vouchers is non-stackable.", 400);
                }
            }

            // 4. Validity Days Check (Bonus Robustness)
            if (voucher.validityDays && voucher.validityDays.length > 0) {
                const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const today = days[new Date().getDay()];
                if (!voucher.validityDays.includes(today)) {
                    throw new AppError(`This voucher is only valid on: ${voucher.validityDays.join(", ")}`, 400);
                }
            }

            voucher.status = VoucherStatus.USED;
            voucher.usedCount += 1;
            await voucher.save({ transaction });

            return voucher;
        } catch (error: any) {
            console.error("RewardService.redeemVoucher Error:", error);
            throw error instanceof AppError ? error : new AppError(error.message || "Failed to redeem voucher", 400);
        }
    }
}
