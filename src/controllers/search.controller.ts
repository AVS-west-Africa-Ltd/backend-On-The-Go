import { Request, Response } from "express";
import { Branch } from "../models/branch.model";
import { Amenity } from "../models/amenity.model";
import { Op } from "sequelize";
import { Profile } from "../models/profile.model";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export const discover = async (req: Request, res: Response) => {
    try {
        const { query, near_me, lat, lng, sort, partners_only, amenity } = req.query;

        const where: any = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { description: { [Op.iLike]: `%${query}%` } }
            ];
        }

        if (partners_only === 'true') {
            where.isPartner = true;
        }

        const include: any[] = [];
        if (amenity) {
            include.push({
                model: Amenity,
                as: "amenities",
                where: { name: { [Op.iLike]: `%${amenity}%` } }
            });
        }

        // 4. Location Filter (Simplified bounding box or distance logic if supported by DB/PostGIS)
        // For now, if 'near_me' is true and lat/lng provided, we might sort by distance in memory or custom query
        // This is a placeholder for geospatial logic.

        const branches = await Branch.findAll({
            where,
            include,
            limit: 20
        });

        return successHandler(res, "Discovery results fetched", 200, branches);

    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong while fetching discovery results", error.status || 500);
    }
};

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) return errorHandler(res, "Query required", 400);

        // search amenities
        const amenities = await Amenity.findAll({
            where: { name: { [Op.iLike]: `%${query}%` } },
            limit: 5
        });

        // search businesses (Branches)
        const businesses = await Branch.findAll({
            where: { name: { [Op.iLike]: `%${query}%` } },
            limit: 5
        });

        // search profiles (Users)
        const profiles = await Profile.findAll({
            where: { userName: { [Op.iLike]: `%${query}%` } },
            attributes: ['id', 'userName', 'picture'],
            limit: 5
        });

        return successHandler(res, "Search results fetched", 200, {
            amenities,
            businesses,
            profiles
        });

    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong while fetching search results", error.status || 500);
    }
};
