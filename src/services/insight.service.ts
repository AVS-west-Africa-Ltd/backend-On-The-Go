import { Profile } from "../models/Profile";
import { Member } from "../models/Member";
import { Post } from "../models/Post";
import { Reaction } from "../models/Reaction";
import { Transaction } from "../models/Transaction";
import { ProfileVisit } from "../models/ProfileVisit";
import { Insight } from "../models/Insight";
import { TInsightType } from "../models/types/insight.types";
import { Op } from "sequelize";
import db from "../models";

const { sequelize } = db;

export class InsightService {
    static async syncInsights() {
        console.log("📊 Starting insight aggregation...");
        const profiles = await Profile.findAll({ attributes: ["id"] });

        for (const profile of profiles) {
            const profileId = profile.id;

            const metrics: Record<TInsightType, () => Promise<number>> = {
                follower: async () => await Member.count({ where: { profileId, memberType: "community" } }), // Wait, member is not follower. Follower is in Friend model.
                following: async () => 0, // Placeholder, will fix below
                profile_visit: async () => await ProfileVisit.count({ where: { profileId } }),
                review: async () => await Post.count({ where: { targetId: profileId, postType: "review" } }),
                rating: async () => await Post.count({ where: { targetId: profileId, postType: "review" } }), // Count of ratings
                like: async () => await Reaction.count({ where: { profileId, type: "like" } }),
                order: async () => await Transaction.count({ where: { businessId: profileId } }),
            };

            // Fix follower/following using Friend model
            const { Friend } = db;
            if (Friend) {
                metrics.follower = async () => await Friend.count({ where: { friendId: profileId } });
                metrics.following = async () => await Friend.count({ where: { ownerId: profileId } });
            }

            for (const [type, getCount] of Object.entries(metrics)) {
                try {
                    const value = await getCount();
                    await Insight.upsert({
                        profileId,
                        type: type as TInsightType,
                        value,
                    });
                } catch (err) {
                    console.error(`❌ Failed to sync ${type} for profile ${profileId}:`, err);
                }
            }
        }
        console.log("✅ Insight aggregation completed.");
    }
}
