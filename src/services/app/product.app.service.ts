import { Op, Transaction, WhereOptions } from "sequelize";
import { upload } from "../../middlewares/upload";
import db from "../../models"
import { Amenity } from "../../models/amenity.model";
import { BranchAmenity } from "../../models/branchAmenity.model";
import { Media } from "../../models/media.model";
import { Product } from "../../models/product.model";
import { MediaTargetTypes } from "../../models/types/media.types";
import { ProductStatus } from "../../models/types/product.types";
import { IBasicUser } from "../../interfaces/common.interface";
import { ICreateProductPayload, IEditProductInput, IFilterBranchProductsParams, IFilterBranchProductsResponse, IGetBranchProductData, IGetBranchProductsResponse, IGetProductsQuery } from "../../interfaces/product.interface";
import { AppError } from "../../utils/errors";
import { Status } from "../../models/types/amenity.types";
import { BranchStaffRole } from "../../models/types/branchStaff.types";
import { Branch } from "../../models/branch.model";
import { BranchStaff } from "../../models/branchStaff.model";

const { sequelize } = db

export class AppProductService {

    static async filterBranchProducts(params: IFilterBranchProductsParams): Promise<IFilterBranchProductsResponse> {

        const { branchId, amenityId, cursor, limit = 10, featured = false } = params;

        const globalWifiAmenity = await Amenity.findOne({
            where: { name: "wifi" },
            attributes: ["id"],
        });

        if (!globalWifiAmenity) {
            throw new AppError("System configuration error: Wi-Fi amenity missing", 500);
        }

        let wifiProducts: Product[] = [];

        const branchWifiAmenity = await BranchAmenity.findOne({
            where: {
                branchId,
                amenityId: globalWifiAmenity.id,
                status: Status.ACTIVE,
            },
            attributes: ["id"],
        });

        if (branchWifiAmenity) {
            wifiProducts = await Product.findAll({
                where: {
                    branchId,
                    branchAmenityId: branchWifiAmenity.id,
                    status: ProductStatus.AVAILABLE,
                },
                include: [
                    {
                        model: Media,
                        as: "media",
                        required: false,
                    },
                    {
                        model: BranchAmenity,
                        as: "branch_amenity",
                        required: true,
                        where: {
                            status: Status.ACTIVE,
                        },
                        include: [
                            {
                                model: Amenity,
                                as: "amenity",
                                attributes: ["id", "name"],
                            },
                        ],
                    },
                ],
                order: [["price", "ASC"]], // Usually user wants cheapest first
            });
        }

        const wifiProductsResponse = wifiProducts.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            isFeatured: product.isFeatured,
            media: product.media?.map((media) => ({
                id: media.id,
                filePath: media.filePath,
            })),
            meta: product.meta,
            branch_amenity: {
                id: product.branch_amenity!.id,
                name: product.branch_amenity!.amenity.name,
            },
        }));



        const whereClause: WhereOptions = {
            branchId,
            status: ProductStatus.AVAILABLE,
            ...(featured ? { isFeatured: true } : {}),
        };

        if (amenityId) {
            if (branchWifiAmenity && amenityId === branchWifiAmenity.id) {
                // return empty for main data to avoid duplication if they request wifi specifically
                return { wifi: wifiProductsResponse, products: [], nextCursor: null };
            }
            whereClause.branchAmenityId = amenityId;
        } else {
            if (branchWifiAmenity) {
                whereClause.branchAmenityId = { [Op.ne]: branchWifiAmenity.id };
            }
        }

        if (cursor) {
            const [createdAt, id] = cursor.split("_");

            (whereClause as any)[Op.or] = [
                { createdAt: { [Op.lt]: createdAt } },
                {
                    createdAt,
                    id: { [Op.lt]: id },
                },
            ];
        }

        const products = await Product.findAll({
            where: whereClause,
            include: [
                {
                    model: Media,
                    as: "media",
                    required: false,
                },
                {
                    model: BranchAmenity,
                    as: "branch_amenity",
                    required: true,
                    where: {
                        status: Status.ACTIVE,
                    },
                    include: [
                        {
                            model: Amenity,
                            as: "amenity",
                            attributes: ["id", "name"],
                        },
                    ],
                },
            ],
            order: [
                ["isFeatured", "DESC"], // featured first
                ["createdAt", "DESC"],
                ["id", "DESC"],
            ],
            limit: limit + 1,
        });


        const productsResponse = products.map((product) => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            currency: product.currency,
            isFeatured: product.isFeatured,
            media: product.media?.map((media) => ({
                id: media.id,
                filePath: media.filePath,
            })),
            meta: product.meta,
            branch_amenity: {
                id: product.branch_amenity!.id,
                name: product.branch_amenity!.amenity.name,
            },
        }));

        let nextCursor: string | null = null;
        const hasNextPage = products.length > limit;

        if (hasNextPage) {
            products.pop();
            const last = products[products.length - 1];
            nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
        }

        return {
            wifi: wifiProductsResponse,
            products: productsResponse,
            nextCursor,
        };
    }

}