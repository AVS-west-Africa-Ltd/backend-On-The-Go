import { IBaseQueryDTO } from "../dtos/base.dto";
import { TPaymentMethod, TTransactionStatus } from "../models/types/transaction.types";

export interface IGetTransactions extends IBaseQueryDTO {
    paymentMethod?: TPaymentMethod;
    status?: TTransactionStatus;
    businessId?: string;
    branchId?: string;
    search?: string;
}