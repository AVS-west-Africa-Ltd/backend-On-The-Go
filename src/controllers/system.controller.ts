import { Request, Response } from "express";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import db from "../models";

export class SystemController {
    /**
     * Check system health including database connectivity and server metrics.
     */
    static async getHealth(req: Request, res: Response) {
        try {
            // Check database connection
            await db.sequelize.authenticate();

            const healthInfo = {
                status: "UP",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                database: {
                    status: "CONNECTED",
                },
                environment: process.env.NODE_ENV || "development",
            };

            return successHandler(res, "System health retrieved successfully", 200, healthInfo);
        } catch (error: any) {
            console.error("Health check failed:", error);
            const errorInfo = {
                status: "DOWN",
                timestamp: new Date().toISOString(),
                database: {
                    status: "DISCONNECTED",
                    error: error.message,
                },
            };
            return errorHandler(res, "System health check failed", 503, errorInfo as any);
        }
    }
}
