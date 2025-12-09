import { Op, Transaction, WhereOptions } from "sequelize";
import { upload } from "../middlewares/upload";
import db from "../models"
import { Amenity } from "../models/Amenity";
import { BranchAmenity } from "../models/BranchAmenity";
import { Media } from "../models/Media";
import { Product } from "../models/Product";
import { MediaTargetTypes } from "../models/types/media.types";
import { ProductStatus } from "../models/types/product.types";
import { IBasicUser } from "./interfaces/common.interface";
import { ICreateProductPayload, IEditProductInput, IGetBranchProductData, IGetBranchProductsResponse, IGetProductsQuery } from "./interfaces/product.interface";
import { AppError } from "../utils/errors";

const { sequelize } = db

export class ProductService {

    static async createProduct(payload: ICreateProductPayload) {
        const t = await sequelize.transaction();

        try {
            const { name, description, price, businessId, userId, branchId, branchAmenityId, meta } = payload;

            const product = await Product.create({
                name,
                description,
                price,
                businessId,
                branchId,
                branchAmenityId,
                status: ProductStatus.AVAILABLE,
                meta: meta || null,
            }, { transaction: t });

            if (payload.files && payload.files.length > 0) {
                const mediaEntries = payload.files.map((file: Express.Multer.File, index: number) => ({
                    targetId: product.id,
                    targetType: MediaTargetTypes.PRODUCT,
                    filePath: file.location || file.path,
                    fileName: file.originalname,
                    mimeType: file.mimetype,
                    userId,
                    metadata: {
                        s3Key: file.key,
                        bucket: file.bucket,
                        etag: file.etag,
                        storageClass: file.storageClass,
                        contentDisposition: file.contentDisposition,
                    },
                    uploadOrder: index,
                }))

                console.log("media for products----", mediaEntries);

                await Media.bulkCreate(mediaEntries, { transaction: t, returning: true, validate: true });

            }

            await t.commit();
            return product;
        } catch (error) {
            await t.rollback();
            console.error("Error creating product:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Failed to create product`);
        }
    }

    static async getBranchProducts(filters: IGetProductsQuery, userData: IBasicUser): Promise<IGetBranchProductsResponse> {
        try {

            const { cursor, limit = 10, search } = filters;
            const { profileId, userId, branchId } = userData;

            

            const whereClause: WhereOptions = {
                branchId,
                businessId: profileId,
                isDeleted: false
            };

            if (cursor) {
                const [lastCreatedAt, lastId] = cursor.split("_");

                (whereClause as any)[Op.or] = [
                    { createdAt: { [Op.lt]: lastCreatedAt } },
                    {
                        createdAt: lastCreatedAt,
                        id: { [Op.lt]: lastId },
                    },
                ];
            }

            if (search) {
                whereClause.name = {
                    [Op.like]: `%${search}%`
                };
            }


            const { count, rows: products } = await Product.findAndCountAll({
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
                        include: [
                            {
                                model: Amenity,
                                as: "amenity",
                                required: true,
                                attributes: ["id", "name"],
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"], ["id", "DESC"]],
                limit: limit + 1,
                distinct: true,
            });

            const formattedProducts: IGetBranchProductData[] = products.map(product => {
                return {
                    id: product.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    status: product.status,
                    meta: product.meta,
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt,
                    media: product.media?.map(m => ({
                        id: m.id,
                        filePath: m.filePath,
                        fileName: m.fileName || "",
                        mimeType: m.mimeType || "",
                    })) ?? [],
                    branch_amenity: {
                        id: product.branch_amenity!.id,
                        amenityName: product.branch_amenity!.amenity.name,
                        amenityId: product.branch_amenity!.amenity.id,
                        status: product.branch_amenity!.status,
                    },
                }
            });

            let nextCursor: string | null = null;
            const hasNextPage = products.length > limit;

            if (hasNextPage) {
                products.pop(); // Remove the extra item used to check for next page
                const lastProduct = products[products.length - 1];
                if (lastProduct && lastProduct.createdAt) {
                    nextCursor = `${lastProduct.createdAt.toISOString()}_${lastProduct.id}`;
                }
            }

            return {
                products: formattedProducts,
                total: count,
                nextCursor,
            };
        } catch (error) {
            console.error("Error fetching products by branch:", error);
            throw new Error("Failed to fetch products for the branch");
        }
    }

    static async getProductById(productId: number, profileId: number, branchId: number) {
        try {

           return await Product.findOne({
                where: {
                    id: productId,
                    businessId: profileId,
                    branchId: branchId,
                    isDeleted: false
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
                        include: [
                            {
                                model: Amenity,
                                as: "amenity",
                                required: true,
                                attributes: ["id", "name"],
                            }
                        ]
                    }
                ],

           });
        } catch (error) {
            console.error("Error fetching products by branch:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Failed to fetch products for the branch");
        }
    }

    static async updateProduct(productData: IEditProductInput, userData: IBasicUser): Promise<Product> {
        const { id, name, description, price, status, meta, branchAmenityId, media } = productData;
        const { userId, branchId } = userData;

        const t: Transaction = await sequelize.transaction();

        try {
            const product = await Product.findOne({ where: { id, branchId }, transaction: t });

            if (!product) throw new AppError("Product not found");

            await product.update(
                {
                    name: name ?? product.name,
                    description: description ?? product.description,
                    price: price ?? product.price,
                    status: status ?? product.status,
                    meta: meta ?? product.meta,
                    branchAmenityId: branchAmenityId ?? product.branchAmenityId,
                },
                { transaction: t }
            );

            if (media) {
                // 1️⃣ REMOVE
                if (media.remove && media.remove.length > 0) {
                    await Media.destroy({
                        where: { id: media.remove, targetId: product.id },
                        transaction: t,
                    });
                }

                // 2️⃣ ADD
                if (media.add && media.add.length > 0) {
                    for (const [index, file] of media.add.entries()) {
                        await Media.create(
                            {
                                userId,
                                targetId: product.id,
                                targetType: MediaTargetTypes.PRODUCT,
                                filePath: file.location || file.path,
                                fileName: file.originalname,
                                mimeType: file.mimetype,
                                metadata: {
                                    s3Key: file.key,
                                    bucket: file.bucket,
                                    etag: file.etag,
                                    storageClass: file.storageClass,
                                    contentDisposition: file.contentDisposition,
                                },
                                uploadOrder: index,
                            },
                            { transaction: t }
                        );
                    }
                }
            }


            await t.commit();

            // Return updated product with media included
            return await Product.findByPk(id, {
                include: [
                    {
                        model: Media,
                        as: "media",
                    },
                    {
                        model: BranchAmenity,
                        as: "branch_amenity",
                        include: [{
                            model: Amenity,
                            as: "amenity",
                            attributes: ["id", "name",],
                        }],
                    },
                ],
            }) as Product;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async deleteProduct(productId: number, profileId: number, branchId: number): Promise<boolean> {
        try {
            const product = await Product.findOne({
                where: {
                    id: productId,
                    businessId: profileId,
                    branchId: branchId,
                    isDeleted: false
                }
            });

            if (!product) {
                throw new AppError("Product not found");
            }

            // Soft delete by setting isDeleted to true
            await product.update({ isDeleted: true, deletedAt: new Date() });
            return true;

        } catch (error) {
            console.error("Error deleting product:", error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Failed to delete product");
        }
    }
}