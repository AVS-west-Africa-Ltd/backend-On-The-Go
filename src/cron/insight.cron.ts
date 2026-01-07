import cron from "node-cron";
import { InsightService } from "../services/insight.service";

export const initInsightCron = () => {
    console.log("⏰ Initializing insight cron job...");

    // Run every hour
    cron.schedule("0 * * * *", async () => {
        try {
            await InsightService.syncInsights();
        } catch (error) {
            console.error("❌ Insight cron job failed:", error);
        }
    });

    // Also run once on startup to populate data
    InsightService.syncInsights().catch((err) =>
        console.error("❌ Initial insight sync failed:", err)
    );
};
