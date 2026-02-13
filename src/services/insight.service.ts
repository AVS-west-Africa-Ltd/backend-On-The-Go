import { Profile } from "../models/profile.model";
import { Member } from "../models/member.model";
import { Post } from "../models/post.model";
import { Reaction } from "../models/reaction.model";
import { Order } from "../models/order.model";
import { ProfileVisit } from "../models/profileVisit.model";
import { Insight } from "../models/insight.model";
import { TInsightType } from "../models/types/insight.types";
import { Op } from "sequelize";
import db from "../models";
import { OrderPaymentStatus } from "../models/types/order.types";

export class InsightService {
    static async syncInsights() {
        // console.log("📊 Starting global insight aggregation...");
        const profiles = await Profile.findAll({ attributes: ["id"] });

        for (const profile of profiles) {
            const profileId = profile.id;

            // Basic metrics (Business wide - branchId = null, period = TOTAL)
            const metrics: Partial<Record<TInsightType, () => Promise<number>>> = {
                profile_visit: async () => await ProfileVisit.count({ where: { profileId } }),
                review: async () => await Post.count({ where: { targetId: profileId, postType: "review" } }),
                rating: async () => await Post.count({ where: { targetId: profileId, postType: "review" } }),
                like: async () => await Reaction.count({ where: { profileId, type: "like" } }),
                order: async () => await Order.count({ where: { businessId: profileId, paymentStatus: OrderPaymentStatus.PAID } }),
                revenue: async () => await Order.sum("totalAmount", { where: { businessId: profileId, paymentStatus: OrderPaymentStatus.PAID } }) || 0,
            };

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
                        branchId: null,
                        type: type as TInsightType,
                        value,
                        period: "TOTAL"
                    });
                } catch (err) {
                    console.error(`❌ Failed to sync ${type} for profile ${profileId}:`, err);
                }
            }
        }
        // console.log("✅ Global insight aggregation completed.");
    }

    static async syncBranchInsights(branchId: number, profileId: number) {
        // console.log(`📊 Syncing insights for branch ${branchId}...`);
        const paidOrders = await Order.findAll({
            where: {
                branchId,
                paymentStatus: OrderPaymentStatus.PAID
            },
            attributes: ['totalAmount', 'customerId', 'amenitiesCategory', 'createdAt'],
            raw: true
        });

        // Group by Month
        const monthlyData: Record<string, { revenue: number, customers: Set<number>, wifi: number }> = {};
        const now = new Date();

        // Ensure last 12 months exist
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[period] = { revenue: 0, customers: new Set(), wifi: 0 };
        }

        paidOrders.forEach(order => {
            const d = new Date(order.createdAt);
            const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[period]) {
                monthlyData[period].revenue += order.totalAmount;
                monthlyData[period].customers.add(order.customerId);
                if (order.amenitiesCategory && Array.isArray(order.amenitiesCategory)) {
                    if (order.amenitiesCategory.includes("wifi")) {
                        monthlyData[period].wifi += 1;
                    }
                }
            }
        });

        // Store monthly data
        const periods = Object.keys(monthlyData).sort();
        for (const period of periods) {
            const data = monthlyData[period];
            await this.saveMetric(profileId, branchId, "revenue", data.revenue, period);
            await this.saveMetric(profileId, branchId, "customer_count", data.customers.size, period);
            await this.saveMetric(profileId, branchId, "wifi_session", data.wifi, period);
        }

        // Calculate Growth (current vs previous month)
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

        const currentData = monthlyData[currentPeriod];
        const prevData = monthlyData[prevPeriod];

        if (currentData && prevData) {
            const revGrowth = this.calculateGrowth(currentData.revenue, prevData.revenue);
            const custGrowth = this.calculateGrowth(currentData.customers.size, prevData.customers.size);
            const wifiGrowth = this.calculateGrowth(currentData.wifi, prevData.wifi);

            await this.saveMetric(profileId, branchId, "revenue_growth", revGrowth, "TOTAL");
            await this.saveMetric(profileId, branchId, "customer_growth", custGrowth, "TOTAL");
            await this.saveMetric(profileId, branchId, "wifi_growth", wifiGrowth, "TOTAL");
        }

        // Aggregates
        const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalCustomers = new Set(paidOrders.map(o => o.customerId)).size;
        const totalWifi = paidOrders.filter(o => o.amenitiesCategory?.includes("wifi")).length;

        await this.saveMetric(profileId, branchId, "revenue", totalRevenue, "TOTAL");
        await this.saveMetric(profileId, branchId, "customer_count", totalCustomers, "TOTAL");
        await this.saveMetric(profileId, branchId, "wifi_session", totalWifi, "TOTAL");

        // console.log(`✅ Branch ${branchId} insights completed.`);
    }

    private static async saveMetric(profileId: number, branchId: number, type: TInsightType, value: number, period: string) {
        await Insight.upsert({
            profileId,
            branchId,
            type,
            value,
            period
        });
    }

    private static calculateGrowth(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(2));
    }
}
