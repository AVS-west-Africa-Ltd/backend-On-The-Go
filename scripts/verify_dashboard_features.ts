import db from "../src/models";
import { RewardService } from "../src/services/reward.service";
import { VoucherType, VoucherStatus } from "../src/models/types/rewardRules.types";
import { User } from "../src/models/User";
import { Profile } from "../src/models/Profile";
import { Branch } from "../src/models/Branch";

const { sequelize } = db;

async function verify() {
    console.log("🚀 Starting Dashboard Features Verification...");

    // Force sync the new models to avoid ENUM issues on MySQL
    console.log("--- Step 0: Syncing Models (Force) ---");
    await (db as any).BusinessRewardRules.sync({ force: true });
    await (db as any).Voucher.sync({ force: true });
    console.log("✅ Models synced.");

    const t = await sequelize.transaction();

    try {
        console.log("--- Setup Test Data ---");
        const user = await User.create({
            firstName: "Dash",
            lastName: "Tester",
            email: `dash_${Date.now()}@example.com`,
            password: "password123",
            phone_number: `090${Math.floor(Math.random() * 10000000)}`
        } as any, { transaction: t });

        const business = await Profile.create({
            userId: user.id,
            userName: `dashbiz_${Date.now()}`,
            profileType: "business"
        } as any, { transaction: t });

        const branch = await Branch.create({
            name: "Dash Branch",
            profileId: business.id,
            streetAddress: "456 Dash Ave",
            city: "Dash City",
            isHQ: true
        } as any, { transaction: t });

        console.log("--- 1. Manual Issuance with Validity Days ---");
        const manualVoucher = await RewardService.manualIssueVoucher({
            userId: user.id,
            businessId: business.id,
            branchId: branch.id,
            voucherType: VoucherType.PERCENTAGE_DISCOUNT,
            value: 15,
            validityDays: ["Monday", "Wednesday", "Friday"],
            expiryHours: 48
        });
        console.log(`✅ Manual Voucher created: Code ${manualVoucher.code}, Days: ${JSON.stringify(manualVoucher.validityDays)}`);

        console.log("--- 2. Branch Retrieval & Search ---");
        const vouchers = await RewardService.getBranchVouchers(branch.id, { search: manualVoucher.code });
        if (vouchers.length === 1 && vouchers[0].code === manualVoucher.code) {
            console.log("✅ Search by code successful.");
        } else {
            throw new Error(`Search failed. Found ${vouchers.length} vouchers.`);
        }

        const filteredVouchers = await RewardService.getBranchVouchers(branch.id, { status: VoucherStatus.UNUSED });
        console.log(`✅ Filtered by UNUSED: Found ${filteredVouchers.length} vouchers.`);

        console.log("\n🎉 Dashboard alignment verification Successful!");

        await t.rollback();
        process.exit(0);
    } catch (error: any) {
        if (t) await t.rollback();
        console.error("\n❌ Verification Failed:", error.message);
        console.error(error);
        process.exit(1);
    }
}

verify();
