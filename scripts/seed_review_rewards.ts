import db from "../src/models";
import { RewardTriggerType, VoucherType } from "../src/models/types/rewardRules.types";

const { BusinessRewardRules, Branch } = db;

async function seed() {
    console.log("Starting seed of default review rewards for all branches...");

    const branches = await Branch.findAll();
    console.log(`Found ${branches.length} branches.`);

    for (const branch of branches) {
        // Check if a review reward rule already exists for this branch
        const existing = await BusinessRewardRules.findOne({
            where: {
                businessId: branch.profileId,
                branchId: branch.id,
                triggerType: RewardTriggerType.REVIEW
            }
        });

        if (!existing) {
            console.log(`Creating default review reward for branch: ${branch.name} (ID: ${branch.id})`);
            await BusinessRewardRules.create({
                businessId: branch.profileId,
                branchId: branch.id,
                name: `Review Voucher - ${branch.name}`,
                triggerType: RewardTriggerType.REVIEW,
                threshold: 1,
                voucherType: VoucherType.PERCENTAGE_DISCOUNT,
                value: 5,
                expiryHours: 72,
                maxPerUser: 1,
                isActive: true
            } as any);
        } else {
            console.log(`Review reward already exists for branch: ${branch.name}`);
        }
    }

    console.log("Seeding complete.");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
});
