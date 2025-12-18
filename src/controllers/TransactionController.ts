import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { AppError } from '../utils/errors';
import { errorHandler, successHandler } from '../handlers/responseHandlers';
import { IGetTransactions } from '../interfaces/transaction.interface';

export class TransactionController {

    static async getTransactions(req: Request, res: Response) {
        try {
            const filters = req.query as unknown as IGetTransactions;
            const profileId = req.profile!.id;
            const data = await TransactionService.getTransactions(filters, profileId);
            return successHandler(res, "Transactions retrieved successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to get transactions", error.statusCode || 500);
        }
    }

    static async getTransactionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const profileId = req.profile!.id;

            if (!id) {
                throw new AppError("Invalid transaction ID", 400);
            }
            const data = await TransactionService.getTransactionById(id, profileId);
            return successHandler(res, "Transaction retrieved successfully", 200, data);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to get transaction", error.statusCode || 500);
        }
    }
}
