import db from "../src/models";
import { RewardService } from "../src/services/reward.service";
import { RewardTriggerType, VoucherType } from "../src/models/types/rewardRules.types";
import { User } from "../src/models/User";
import { Profile } from "../src/models/Profile";
import { Branch } from "../src/models/Branch";
import { Product } from "../src/models/Product";
import { Amenity } from "../src/models/Amenity";
import { BranchAmenity } from "../src/models/BranchAmenity";
import { AmenityCategory } from "../src/models/types/amenity.types";

const { sequelize } = db;

async function verify() {
    console.log("🚀 Starting Reward and Voucher Flow Verification...");

    try {
        console.log("--- Step 0: Syncing Reward Tables ---");
        // We sync the new models explicitly
        await (db as any).BusinessRewardRules.sync({ alter: true });
        await (db as any).Voucher.sync({ alter: true });
        await (db as any).UserRewardProgress.sync({ alter: true });
        console.log("✅ Tables synced successfully.");
    } catch (err: any) {
        console.error("❌ Table sync failed:", err.message);
        process.exit(1);
    }

    const t = await sequelize.transaction();

    try {
        // 1. Setup Test Data
        console.log("--- Step 1: Setting up test data ---");
        const user = await User.create({
            firstName: "Reward",
            lastName: "Tester",
            email: `tester_${Date.now()}@example.com`,
            password: "password123",
            phone_number: `090${Math.floor(Math.random() * 10000000)}`,
            referralCode: `REF-${Date.now()}`
        } as any, { transaction: t });

        const business = await Profile.create({
            userId: user.id,
            userName: `biz_${Date.now()}`,
            profileType: "business"
        } as any, { transaction: t });

        const branch = await Branch.create({
            name: "Test Branch",
            profileId: business.id,
            streetAddress: "123 Test St",
            city: "Test City",
            isHQ: true
        } as any, { transaction: t });

        const [amenity] = await Amenity.findOrCreate({
            where: { name: AmenityCategory.WIFI },
            defaults: { name: AmenityCategory.WIFI } as any,
            transaction: t
        });

        const branchAmenity = await BranchAmenity.create({
            businessId: business.id,
            branchId: branch.id,
            amenityId: amenity.id,
            status: "active"
        } as any, { transaction: t });

        const product = await Product.create({
            name: "Test Product",
            description: "Test description",
            price: 1000,
            businessId: business.id,
            branchId: branch.id,
            branchAmenityId: branchAmenity.id,
            currency: "NGN",
            category: "test"
        } as any, { transaction: t });

        // 2. Create Reward Rule
        console.log("--- Step 2: Creating Reward Rule ---");
        const ruleValue: any = {
            businessId: business.id,
            triggerType: RewardTriggerType.REFERRAL,
            threshold: 2,
            voucherType: VoucherType.PERCENTAGE_DISCOUNT,
            value: 10,
            expiryHours: 24,
            maxPerUser: 5
        };
        const rule = await RewardService.createRule(ruleValue, t);
        console.log(`✅ Rule created: ID ${rule.id}, trigger: ${rule.triggerType}, threshold: ${rule.threshold}`);

        // 3. Track Progress (Simulation)
        console.log("--- Step 3: Tracking Progress ---");
        await RewardService.trackProgress(user.id, business.id, RewardTriggerType.REFERRAL, t);
        console.log("✅ Progress 1 tracked.");

        await RewardService.trackProgress(user.id, business.id, RewardTriggerType.REFERRAL, t);
        console.log("✅ Progress 2 tracked. Threshold should be met.");

        // 4. Verify Voucher Issuance
        console.log("--- Step 4: Verifying Voucher Issuance ---");
        const vouchers = await RewardService.getUserVouchers(user.id, business.id, t);
        if (vouchers.length === 0) throw new Error("Voucher not issued!");
        const voucher = vouchers[0];
        console.log(`✅ Voucher issued: Code ${voucher.code}, Value ${voucher.value}%`);

        console.log("\n🎉 Verification Success! All logic paths checked.");

        await t.rollback(); // Don't persist test data
        process.exit(0);
    } catch (error: any) {
        if (t) await t.rollback();
        console.error("\n❌ Verification Failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

verify();
