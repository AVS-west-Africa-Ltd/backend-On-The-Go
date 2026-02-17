import db from "../models";
import { Op, Transaction } from "sequelize";
import { BusinessRewardRules } from "../models/RewardRules";
import { Voucher } from "../models/Voucher";
import { UserRewardProgress } from "../models/UserRewardProgress";
import { RewardTriggerType, VoucherType, VoucherStatus, ICreateRewardRule, IManualIssueVoucher } from "../models/types/rewardRules.types";
import { AppError } from "../utils/errors";
import { randomCharacters } from "../utils/helpers";

const { sequelize } = db;

export class RewardService {
    static async createRule(data: ICreateRewardRule, transaction?: Transaction) {
        return await BusinessRewardRules.create({
            businessId: data.businessId,
            branchId: data.branchId ?? null,
            name: data.name ?? null,
            triggerType: data.triggerType,
            threshold: data.threshold,
            voucherType: data.voucherType,
            value: data.value,
            validityDays: data.validityDays ? JSON.stringify(data.validityDays) : null,
            expiryHours: data.expiryHours ?? 24,
            maxPerUser: data.maxPerUser ?? 5,
        } as any, { transaction });
    }

    /**
     * Get rules for a business or branch
     */
    static async getRules(businessId: number, branchId?: number) {
        const where: any = { businessId, isActive: true };
        if (branchId) {
            where[Op.or] = [{ branchId: null }, { branchId }];
        } else {
            where.branchId = null;
        }
        return await BusinessRewardRules.findAll({ where });
    }

    /**
     * Tracks progress towards a reward for a user.
     * Called when a trigger event occurs (e.g. referral, review).
     */
    static async trackProgress(userId: number, businessId: number, triggerType: RewardTriggerType, branchId?: number, transaction?: Transaction) {
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

                // MULTI THRESHOLD SUPPORT
                const rewardCount = Math.floor(progress.progress / rule.threshold);

                if (rewardCount > 0) {
                    for (let i = 0; i < rewardCount; i++) {

                        if (voucherCount + i >= rule.maxPerUser) break;

                        await this.issueVoucher(userId, rule, t);
                    }

                    progress.progress = progress.progress % rule.threshold;
                }

                await progress.save({ transaction: t });
            }

            if (!transaction) await t.commit();
        } catch (error) {
            if (!transaction) await t.rollback();
            throw error;
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

        const code = `VOU-${randomCharacters(8).toUpperCase()}`;

        return await Voucher.create({
            code,
            userId,
            businessId: rule.businessId,
            branchId: rule.branchId,
            ruleId: rule.id,
            validityDays: rule.validityDays ? (typeof rule.validityDays === 'string' ? rule.validityDays : JSON.stringify(rule.validityDays)) : null,
            voucherType: rule.voucherType,
            value: rule.value,
            status: VoucherStatus.UNUSED,
            validFrom,
            validUntil,
            usageLimit: 1,
            usedCount: 0
        } as any, { transaction });
    }


    /**
     * Get user's vouchers
     */
    static async getUserVouchers(userId: number, businessId?: number, transaction?: Transaction) {
        const where: any = { userId };
        if (businessId) where.businessId = businessId;

        return await Voucher.findAll({
            where,
            order: [['createdAt', 'DESC']],
            transaction
        });
    }

    /**
     * Get vouchers for a branch with status filtering and search
     */
    static async getBranchVouchers(branchId: number, options: { status?: VoucherStatus, search?: string }) {
        const where: any = { branchId };
        if (options.status) {
            where.status = options.status;
        }
        if (options.search) {
            where.code = { [Op.like]: `%${options.search}%` };
        }
        return await Voucher.findAll({
            where,
            include: [
                {
                    model: db.User,
                    attributes: ['firstName', 'lastName', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    }

    /**
     * Manually issue a voucher to a user
     */
    static async manualIssueVoucher(data: IManualIssueVoucher) {
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
            validityDays: data.validityDays ? JSON.stringify(data.validityDays) : null,
            status: VoucherStatus.UNUSED,
            validFrom,
            validUntil,
            usageLimit: 1,
            usedCount: 0,
            isStackable: false
        } as any);
    }

    /**
     * Redeem a voucher (manual redemption or via internal service)
     */
    static async redeemVoucher(voucherId: number, userId: number, transaction?: Transaction) {
        const voucher = await Voucher.findOne({
            where: { id: voucherId, userId },
            transaction
        });

        if (!voucher) throw new AppError("Voucher not found", 404);
        if (voucher.status !== VoucherStatus.UNUSED) throw new AppError("Voucher is not valid or already used", 400);
        if (new Date() > voucher.validUntil) throw new AppError("Voucher has expired", 400);

        voucher.status = VoucherStatus.USED;
        voucher.usedCount += 1;
        await voucher.save({ transaction });

        return voucher;
    }
}
