import { Op } from "sequelize";
import db from "../src/models";
import { RewardTriggerType, VoucherType, VoucherStatus } from "../src/models/types/rewardRules.types";
import { randomCharacters } from "../src/utils/helpers";

const { BusinessRewardRules, Branch, User, Voucher } = db;

async function seed() {
    console.log("🚀 Starting comprehensive reward and voucher seeding...");

    const branches = await Branch.findAll();
    const users = await User.findAll();

    console.log(`📊 Found ${branches.length} branches and ${users.length} users.`);

    // 0. Cleanup existing seeded data
    console.log("🧹 Cleaning up existing seeded data...");
    await BusinessRewardRules.destroy({
        where: {
            name: { [Op.like]: `% Reward - %` } // Targeted cleanup for rules created by this script
        }
    });
    await Voucher.destroy({
        where: {
            code: { [Op.like]: 'SEED-%' }
        }
    });
    console.log("✅ Cleanup complete.");

    const triggerTypes = Object.values(RewardTriggerType).filter(t => t !== RewardTriggerType.MANUAL);
    const voucherTypes = Object.values(VoucherType);

    // 1. Seed Diverse Reward Rules for each Branch
    console.log("🛠  Seeding Diverse Reward Rules...");
    for (const branch of branches) {
        for (let i = 0; i < triggerTypes.length; i++) {
            const trigger = triggerTypes[i];
            const vType = voucherTypes[i % voucherTypes.length];

            // Check if rule already exists to avoid duplicates
            const existing = await BusinessRewardRules.findOne({
                where: {
                    businessId: branch.profileId,
                    branchId: branch.id,
                    triggerType: trigger
                }
            });

            if (!existing) {
                await BusinessRewardRules.create({
                    businessId: branch.profileId,
                    branchId: branch.id,
                    name: `${trigger.charAt(0) + trigger.slice(1).toLowerCase()} Reward - ${branch.name}`,
                    description: `This is a ${trigger.toLowerCase()} reward for ${branch.name}.`,
                    triggerType: trigger,
                    threshold: trigger === RewardTriggerType.REFERRAL ? 3 : 1,
                    voucherType: vType,
                    value: vType === VoucherType.PERCENTAGE_DISCOUNT ? 10 : (vType === VoucherType.FIXED_DISCOUNT ? 500 : 1),
                    validityDays: ["Monday", "Wednesday", "Friday"],
                    expiryHours: 72,
                    maxPerUser: 5,
                    minOrderAmount: 1000, // New field
                    isStackable: true,   // New field
                    isActive: true
                } as any);
            }
        }
    }
    console.log("✅ Reward Rules seeded.");

    // 2. Seed Random Vouchers for each User
    console.log("🎟  Seeding Random User Vouchers...");
    for (const user of users) {
        // Give each user 2-4 random vouchers
        const voucherCount = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < voucherCount; i++) {
            const randomBranch = branches[Math.floor(Math.random() * branches.length)];
            const rules = await BusinessRewardRules.findAll({
                where: { branchId: randomBranch.id }
            });

            if (rules.length === 0) continue;

            const randomRule = rules[Math.floor(Math.random() * rules.length)];
            const validFrom = new Date();
            const validUntil = new Date();
            validUntil.setHours(validUntil.getHours() + (randomRule.expiryHours || 72));

            await Voucher.create({
                code: `SEED-${randomCharacters(8).toUpperCase()}`,
                userId: user.id,
                businessId: randomRule.businessId,
                branchId: randomRule.branchId,
                ruleId: randomRule.id,
                voucherType: randomRule.voucherType,
                value: randomRule.value,
                validityDays: randomRule.validityDays,
                productId: randomRule.productId,
                minOrderAmount: randomRule.minOrderAmount,
                maxDiscountAmount: randomRule.maxDiscountAmount,
                isStackable: randomRule.isStackable,
                status: Math.random() > 0.3 ? VoucherStatus.UNUSED : VoucherStatus.USED,
                validFrom,
                validUntil,
                usageLimit: 1,
                usedCount: 0,
            } as any);
        }
    }
    console.log("✅ User Vouchers seeded.");

    console.log("🏁 Comprehensive seeding complete.");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
