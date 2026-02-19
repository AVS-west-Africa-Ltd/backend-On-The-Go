import { appEvents } from "../utils/events";
import { REWARD_EVENT, BRANCH_EVENT, TRewardReviewEventData, TBranchCreatedEventData } from "./types";
import { RewardService } from "../services/reward.service";
import { RewardTriggerType, VoucherType } from "../models/types/rewardRules.types";

export const registerRewardListeners = () => {
    // Handle Review Creation
    appEvents.on(REWARD_EVENT.REVIEW_CREATED, onReviewCreated);

    // Handle Branch Creation to add default reward rule
    appEvents.on(BRANCH_EVENT.BRANCH_CREATED, onBranchCreated);
};

const onReviewCreated = async (data: TRewardReviewEventData) => {
    try {
        const { userId, businessId, branchId } = data;
        console.log(`[RewardSubscriber] Processing review reward for user ${userId} at branch ${branchId}`);

        await RewardService.trackProgress({
            userId,
            businessId,
            triggerType: RewardTriggerType.REVIEW,
            branchId
        });
    } catch (error) {
        console.error("[RewardSubscriber] Error processing review reward:", error);
    }
};

const onBranchCreated = async (data: TBranchCreatedEventData) => {
    try {
        const { profileId, branchId, name } = data;
        console.log(`[RewardSubscriber] Creating default review reward rule for branch ${branchId} (${name})`);

        // Create a default reward rule for reviews for this specific branch
        // Business owner can adjust this later in the dashboard
        await RewardService.createRule({
            businessId: profileId,
            branchId: branchId,
            name: `Review Voucher - ${name}`,
            triggerType: RewardTriggerType.REVIEW,
            threshold: 1, // Reward after 1 review
            voucherType: VoucherType.PERCENTAGE_DISCOUNT,
            value: 5, // Default 5% discount
            expiryHours: 72, // Valid for 3 days
            maxPerUser: 1, // One per person per review rule? Or more?
        });

        console.log(`[RewardSubscriber] Default review reward rule created for branch ${branchId}`);
    } catch (error) {
        console.error("[RewardSubscriber] Error creating default reward rule:", error);
    }
};
