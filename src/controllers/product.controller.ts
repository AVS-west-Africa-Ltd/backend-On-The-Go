import { Request, Response } from "express";
import { successHandler, errorHandler } from "../handlers/responseHandlers";
import { FilterBranchProductsQuery, ICreateProductDTO, IUpdateProductDTO } from "../dtos/product.dto";
import { ProductService } from "../services/product.service";

export const create = async (req: Request, res: Response) => {
    try {

        const data: ICreateProductDTO = req.body;

        const profileId = req.profile!.id;
        const userId = req.user;
        // Prioritize branchId from body (if provided and validated), otherwise use token branch
        const branchId = data.branchId || req.branch;

        if (data.meta && typeof data.meta === 'string') {
            data.meta = JSON.parse(data.meta);
        }

        const product = await ProductService.createProduct({
            ...data,
            businessId: profileId,
            userId: userId!,
            branchId: branchId!,
            files: req.files as Express.Multer.File[],
        });

        return successHandler(res, "Product created successfully", 201, product);
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to create product", 500, error);
    }
}

export const getBranchProducts = async (req: Request, res: Response) => {
    try {
        const { branchId, cursor, limit = "10", search = "" } = req.query;
        const profileId = req.profile!.id;
        const userId = req.user;
        const loggedInUserBranchId = req.branch!;

        let branchIdd: number | undefined;

        if (branchId && !isNaN(Number(branchId))) {
            branchIdd = Number(branchId);
        } else {
            branchIdd = loggedInUserBranchId;
        }

        if (!branchIdd) {
            return errorHandler(res, "Invalid branch ID", 400);
        }

        const { products, total, nextCursor } = await ProductService.getBranchProducts(
            {
                cursor: cursor as string,
                limit: parseInt(limit as string, 10),
                search: search as string
            },
            {
                profileId,
                userId,
                branchId: branchIdd,
            }
        );

        return successHandler(res, "Products fetched successfully", 200, {
            products,
            total,
            nextCursor,
            limit: parseInt(limit as string, 10)
        });
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to fetch products", 500, error);
    }
}

export const update = async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const profileId = req.profile!.id;
        const userId = req.user!;
        const branchId = req.branch!;

        if (!productId || isNaN(productId)) {
            return errorHandler(res, "Invalid product ID", 400);
        }

        const updateData: IUpdateProductDTO = {
            ...req.body,
            media: {
                keep: JSON.parse(req.body.keep ?? "[]"),
                remove: JSON.parse(req.body.remove ?? "[]"),
                add: req.files as Express.Multer.File[] ?? []
            }
        };

        const updatedProduct = await ProductService.updateProduct({
            id: productId,
            ...updateData
        },
            {
                userId,
                branchId,
                profileId,
            });

        return successHandler(res, "Product updated successfully", 200, updatedProduct);

    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to update product", 500);
    }
};

export const getProduct = async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const profileId = req.profile!.id;
        const userId = req.user!;
        const branchId = req.branch!;

        if (!productId || isNaN(productId)) {
            return errorHandler(res, "Invalid product ID", 400);
        }

        const product = await ProductService.getProductById(productId, profileId, branchId);

        if (!product) {
            return errorHandler(res, "Product not found", 404);
        }

        return successHandler(res, "Product fetched successfully", 200, product);
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to fetch product", 500, error);
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const profileId = req.profile!.id;
        const userId = req.user!;
        const branchId = req.branch!;

        if (!productId || isNaN(productId)) {
            return errorHandler(res, "Invalid product ID", 400);
        }

        const deleted = await ProductService.deleteProduct(productId, profileId, branchId);

        if (!deleted) {
            return errorHandler(res, "Product could not be deleted", 404);
        }

        return successHandler(res, "Product deleted successfully", 200);
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Something went wrong while deleting the product", 500, error);
    }
};

export const filterBranchProducts = async (req: Request, res: Response) => {
    try {
        const { branchId, amenityId, cursor, limit, featured } = req.query as unknown as FilterBranchProductsQuery;
        const profileId = req.profile!.id;
        const userId = req.user!;

        if (!branchId) {
            return errorHandler(res, "Invalid branch ID", 400);
        }

        const products = await ProductService.filterBranchProducts({
            branchId: branchId,
            amenityId: amenityId,
            cursor: cursor,
            limit: limit,
            featured: featured,
        });

        return successHandler(res, "Products fetched successfully", 200, products);
    } catch (error: any) {
        console.error(error);
        return errorHandler(res, error.message || "Failed to fetch products", 500, error);
    }
}   
