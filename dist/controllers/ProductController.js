"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.getProduct = exports.update = exports.getBranchProducts = exports.create = void 0;
const responseHandlers_1 = require("../handlers/responseHandlers");
const product_service_1 = require("../services/product.service");
const create = async (req, res) => {
    try {
        const data = req.body;
        const profileId = req.profile.id;
        const userId = req.user;
        const branchId = req.branch;
        if (data.meta && typeof data.meta === 'string') {
            data.meta = JSON.parse(data.meta);
        }
        const product = await product_service_1.ProductService.createProduct({
            ...data,
            businessId: profileId,
            userId: userId,
            branchId: branchId,
            files: req.files,
        });
        return (0, responseHandlers_1.successHandler)(res, "Product created successfully", 201, product);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to create product", 500, error);
    }
};
exports.create = create;
const getBranchProducts = async (req, res) => {
    try {
        const { cursor, limit = "10", search = "" } = req.query;
        const profileId = req.profile.id;
        const userId = req.user;
        const branchId = req.params.branchId;
        const { products, total, nextCursor } = await product_service_1.ProductService.getBranchProducts({
            cursor: cursor,
            limit: parseInt(limit, 10),
            search: search
        }, {
            profileId,
            userId,
            branchId: parseInt(branchId),
        });
        return (0, responseHandlers_1.successHandler)(res, "Products fetched successfully", 200, {
            products,
            total,
            nextCursor,
            limit: parseInt(limit, 10)
        });
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to fetch products", 500, error);
    }
};
exports.getBranchProducts = getBranchProducts;
const update = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const profileId = req.profile.id;
        const userId = req.user;
        const branchId = req.branch;
        if (!productId || isNaN(productId)) {
            return (0, responseHandlers_1.errorHandler)(res, "Invalid product ID", 400);
        }
        const updateData = {
            ...req.body,
            media: {
                keep: JSON.parse(req.body.keep ?? "[]"),
                remove: JSON.parse(req.body.remove ?? "[]"),
                add: req.files ?? []
            }
        };
        const updatedProduct = await product_service_1.ProductService.updateProduct({
            id: productId,
            ...updateData
        }, {
            userId,
            branchId,
            profileId,
        });
        return res.status(200).json({
            message: "Product updated successfully",
            data: updatedProduct,
        });
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to update product", 500);
    }
};
exports.update = update;
const getProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const profileId = req.profile.id;
        const userId = req.user;
        const branchId = req.branch;
        if (!productId || isNaN(productId)) {
            return (0, responseHandlers_1.errorHandler)(res, "Invalid product ID", 400);
        }
        const product = await product_service_1.ProductService.getProductById(productId, profileId, branchId);
        if (!product) {
            return (0, responseHandlers_1.errorHandler)(res, "Product not found", 404);
        }
        return (0, responseHandlers_1.successHandler)(res, "Product fetched successfully", 200, product);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Failed to fetch product", 500, error);
    }
};
exports.getProduct = getProduct;
const deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const profileId = req.profile.id;
        const userId = req.user;
        const branchId = req.branch;
        if (!productId || isNaN(productId)) {
            return (0, responseHandlers_1.errorHandler)(res, "Invalid product ID", 400);
        }
        const deleted = await product_service_1.ProductService.deleteProduct(productId, profileId, branchId);
        if (!deleted) {
            return (0, responseHandlers_1.errorHandler)(res, "Product could not be deleted", 404);
        }
        return (0, responseHandlers_1.successHandler)(res, "Product deleted successfully", 200);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorHandler)(res, error.message || "Something went wrong while deleting the product", 500, error);
    }
};
exports.deleteProduct = deleteProduct;
