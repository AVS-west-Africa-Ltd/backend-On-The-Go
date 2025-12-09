"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = __importDefault(require("../models"));
const Amenity_1 = require("../models/Amenity");
const BranchAmenity_1 = require("../models/BranchAmenity");
const Media_1 = require("../models/Media");
const Product_1 = require("../models/Product");
const media_types_1 = require("../models/types/media.types");
const product_types_1 = require("../models/types/product.types");
const errors_1 = require("../utils/errors");
const { sequelize } = models_1.default;
class ProductService {
    static async createProduct(payload) {
        const t = await sequelize.transaction();
        try {
            const { name, description, price, businessId, userId, branchId, branchAmenityId, meta } = payload;
            const product = await Product_1.Product.create({
                name,
                description,
                price,
                businessId,
                branchId,
                branchAmenityId,
                status: product_types_1.ProductStatus.AVAILABLE,
                meta: meta || null,
            }, { transaction: t });
            if (payload.files && payload.files.length > 0) {
                const mediaEntries = payload.files.map((file, index) => ({
                    targetId: product.id,
                    targetType: media_types_1.MediaTargetTypes.PRODUCT,
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
                }));
                console.log("media for products----", mediaEntries);
                await Media_1.Media.bulkCreate(mediaEntries, { transaction: t, returning: true, validate: true });
            }
            await t.commit();
            return product;
        }
        catch (error) {
            await t.rollback();
            console.error("Error creating product:", error);
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError(`Failed to create product`);
        }
    }
    static async getBranchProducts(filters, userData) {
        try {
            const { cursor, limit = 10, search } = filters;
            const { profileId, userId, branchId } = userData;
            const whereClause = {
                branchId,
                businessId: profileId,
                isDeleted: false
            };
            if (cursor) {
                const [lastCreatedAt, lastId] = cursor.split("_");
                whereClause[sequelize_1.Op.or] = [
                    { createdAt: { [sequelize_1.Op.lt]: lastCreatedAt } },
                    {
                        createdAt: lastCreatedAt,
                        id: { [sequelize_1.Op.lt]: lastId },
                    },
                ];
            }
            if (search) {
                whereClause.name = {
                    [sequelize_1.Op.like]: `%${search}%`
                };
            }
            const { count, rows: products } = await Product_1.Product.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Media_1.Media,
                        as: "media",
                        required: false,
                    },
                    {
                        model: BranchAmenity_1.BranchAmenity,
                        as: "branch_amenity",
                        required: true,
                        include: [
                            {
                                model: Amenity_1.Amenity,
                                as: "amenity",
                                required: true,
                                attributes: ["id", "name", "description"],
                            }
                        ]
                    }
                ],
                order: [["createdAt", "DESC"], ["id", "DESC"]],
                limit: limit + 1,
                distinct: true,
            });
            const formattedProducts = products.map(product => {
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
                        id: product.branch_amenity.id,
                        amenityName: product.branch_amenity.amenity.name,
                        amenityId: product.branch_amenity.amenity.id,
                        status: product.branch_amenity.status,
                    },
                };
            });
            let nextCursor = null;
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
        }
        catch (error) {
            console.error("Error fetching products by branch:", error);
            throw new Error("Failed to fetch products for the branch");
        }
    }
    static async getProductById(productId, profileId, branchId) {
        try {
            return await Product_1.Product.findOne({
                where: {
                    id: productId,
                    businessId: profileId,
                    branchId: branchId,
                    isDeleted: false
                },
                include: [
                    {
                        model: Media_1.Media,
                        as: "media",
                        required: false,
                    },
                    {
                        model: BranchAmenity_1.BranchAmenity,
                        as: "branch_amenity",
                        required: true,
                        include: [
                            {
                                model: Amenity_1.Amenity,
                                as: "amenity",
                                required: true,
                                attributes: ["id", "name"],
                            }
                        ]
                    }
                ],
            });
        }
        catch (error) {
            console.error("Error fetching products by branch:", error);
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError("Failed to fetch products for the branch");
        }
    }
    static async updateProduct(productData, userData) {
        const { id, name, description, price, status, meta, branchAmenityId, media } = productData;
        const { userId, branchId } = userData;
        const t = await sequelize.transaction();
        try {
            const product = await Product_1.Product.findOne({ where: { id, branchId }, transaction: t });
            if (!product)
                throw new errors_1.AppError("Product not found");
            await product.update({
                name: name ?? product.name,
                description: description ?? product.description,
                price: price ?? product.price,
                status: status ?? product.status,
                meta: meta ?? product.meta,
                branchAmenityId: branchAmenityId ?? product.branchAmenityId,
            }, { transaction: t });
            if (media) {
                // 1️⃣ REMOVE
                if (media.remove && media.remove.length > 0) {
                    await Media_1.Media.destroy({
                        where: { id: media.remove, targetId: product.id },
                        transaction: t,
                    });
                }
                // 2️⃣ ADD
                if (media.add && media.add.length > 0) {
                    for (const [index, file] of media.add.entries()) {
                        await Media_1.Media.create({
                            userId,
                            targetId: product.id,
                            targetType: media_types_1.MediaTargetTypes.PRODUCT,
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
                        }, { transaction: t });
                    }
                }
            }
            await t.commit();
            // Return updated product with media included
            return await Product_1.Product.findByPk(id, {
                include: [
                    {
                        model: Media_1.Media,
                        as: "media",
                    },
                    {
                        model: BranchAmenity_1.BranchAmenity,
                        as: "branch_amenity",
                        include: [{
                                model: Amenity_1.Amenity,
                                as: "amenity",
                                attributes: ["id", "name",],
                            }],
                    },
                ],
            });
        }
        catch (error) {
            await t.rollback();
            throw error;
        }
    }
    static async deleteProduct(productId, profileId, branchId) {
        try {
            const product = await Product_1.Product.findOne({
                where: {
                    id: productId,
                    businessId: profileId,
                    branchId: branchId,
                    isDeleted: false
                }
            });
            if (!product) {
                throw new errors_1.AppError("Product not found");
            }
            // Soft delete by setting isDeleted to true
            await product.update({ isDeleted: true, deletedAt: new Date() });
            return true;
        }
        catch (error) {
            console.error("Error deleting product:", error);
            if (error instanceof errors_1.AppError) {
                throw error;
            }
            throw new errors_1.AppError("Failed to delete product");
        }
    }
}
exports.ProductService = ProductService;
