import { Request, Response } from "express";
import { Branch } from "../models/Branch";
import { Amenity } from "../models/Amenity";
import { BranchAmenity } from "../models/BranchAmenity";
import { Op } from "sequelize";
import { Profile } from "../models/Profile";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { ProfileType, TProfileType } from "../models/types/profile.types";

export const discover = async (req: Request, res: Response) => {
    try {
        const { query, near_me, lat, type, lng, sort, partners_only, amenity, radius = 10000 } = req.query;

        const whereClause: any = {};

        if (query) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${query}%` } },
                { description: { [Op.like]: `%${query}%` } }
            ];
        }

        if (partners_only === 'true') {
            whereClause.isPartner = true;
        }


        const include: any[] = [];

        if (type && Object.values(ProfileType).includes(type as any)) {
            include.push({
                model: Profile,
                as: "profile",
                where: { profileType: type },
                attributes: ["id", "userName", "picture", "profileType"]
            });
        }
        if (amenity) {
            include.push({
                model: BranchAmenity,
                as: "branch_amenities",
                required: true,
                include: [
                    {
                        model: Amenity,
                        as: "amenity",
                        required: true,
                        where: { name: { [Op.like]: `%${amenity}%` } }
                    }
                ]
            });
        }

        let attributes: any = undefined;
        let order: any = [['createdAt', 'DESC']];

        if (near_me === 'true' && lat && lng) {
            const latitude = parseFloat(lat as string);
            const longitude = parseFloat(lng as string);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                const sequelize = Branch.sequelize!;
                const distanceField = sequelize.fn(
                    "ST_Distance_Sphere",
                    sequelize.col("Branch.geoLocation"),
                    sequelize.fn("ST_GeomFromText", `POINT(${longitude} ${latitude})`)
                );

                whereClause[Op.and] = sequelize.where(distanceField, { [Op.lte]: Number(radius) });

                if (sort === 'distance') {
                    attributes = {
                        include: [[distanceField, 'distance']]
                    };
                    order = [[sequelize.literal('distance'), 'ASC']];
                }
            }
        }

        const branches = await Branch.findAll({
            where: whereClause,
            include,
            attributes,
            order,
            limit: 20,
            subQuery: false
        });

        return successHandler(res, "Discovery results fetched", 200, branches);

    } catch (error: any) {
        return errorHandler(res, error.message || "Something went wrong while fetching discovery results", error.status || 500, error);
    }
};

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        if (!query) return errorHandler(res, "Query required", 400);

        // search amenities
        const amenities = await Amenity.findAll({
            where: { name: { [Op.like]: `%${query}%` } },
            limit: 5
        });

        // search businesses (Branches)
        const branches = await Branch.findAll({
            where: { name: { [Op.like]: `%${query}%` } },
            limit: 5
        });

        // search profiles (Users)
        const profiles = await Profile.findAll({
            where: { userName: { [Op.like]: `%${query}%` } },
            attributes: ['id', 'userName', 'picture'],
            limit: 5
        });


        return successHandler(res, "Search results fetched", 200, {
            amenities,
            branches,
            profiles
        });

    } catch (error: any) {
        console.log('error fetching search results---', error);
        return errorHandler(res, error.message || "Something went wrong while fetching search results", error.status || 500, error);
    }
};
