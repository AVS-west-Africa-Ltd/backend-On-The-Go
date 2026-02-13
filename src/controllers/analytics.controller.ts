import { Request, Response } from "express";
import { Insight } from "../models/insight.model";
import { TInsightType } from "../models/types/insight.types";
import { InsightService } from "../services/insight.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export const getAnalyticsSummary = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;

        // Optionally trigger sync if data is stale (or rely on scheduled cron)
        // await InsightService.syncInsights(); 

        const insights = await Insight.findAll({
            where: { profileId }
        });

        const summary = insights.reduce((acc, curr) => {
            acc[curr.type] = curr.value;
            return acc;
        }, {} as Record<string, number>);

        return successHandler(res, "Analytics summary fetched successfully", 200, summary);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch analytics summary", error.status || 500);
    }
};

export const getProfileVisits = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        // In future: fetch historical data from a different table or time-series logic
        // For now, returning current aggregate
        const visitCount = await Insight.findOne({
            where: { profileId, type: "profile_visit" }
        });

        return successHandler(res, "Profile visits fetched successfully", 200, visitCount?.value || 0);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch profile visits", error.status || 500);
    }
};

export const getEngagement = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        const types: TInsightType[] = ["like", "review", "rating"];

        const insights = await Insight.findAll({
            where: { profileId, type: types }
        });

        return successHandler(res, "Engagement data fetched successfully", 200, insights);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch engagement data", error.status || 500);
    }
};

export const getSalesStats = async (req: Request, res: Response) => {
    try {
        const profileId = req.profile!.id;
        // Assuming 'order' tracks sales count. 
        // Ticket/Voucher types might need to be added to TInsightType enum if not present.

        const sales = await Insight.findOne({
            where: { profileId, type: "order" }
        });

        return successHandler(res, "Sales stats fetched successfully", 200, sales?.value || 0);
    } catch (error: any) {
        return errorHandler(res, error.message || "Failed to fetch sales stats", error.status || 500);
    }
};
