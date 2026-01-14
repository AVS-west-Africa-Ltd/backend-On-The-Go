import { IBaseQueryDTO } from "../dtos/base.dto";
import { TAmenityCategory } from "../models/types/amenity.types";
import { TOrderPaymentStatus, TOrderStatus } from "../models/types/order.types";

export interface ICreateOrderPayload {
    businessId: number;
    branchId: number;
    items: IOrderItemPayload[];
    voucherId?: number;
}

export interface IUpdateOrderPayload {
    items: IOrderItemPayload[];
    branchId: number;
    userId: number;
    profileId: number;
    orderId: string;
}

export interface IGetBranchOrdersPayload extends IBaseQueryDTO {
    branchId: number;
    userId: number;
    profileId: number;
    orderStatus?: TOrderStatus;
    search?: string;
}

export interface IOrderItemPayload {
    productId: number;
    quantity: number;
}

export interface ICheckoutResponse {
    paymentUrl: string;
    reference: string;
    accessCode: string;
}

export interface IPaystackInitializeResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface IPaymentInitializeResponse {
    provider: string;
    authorization_url: string;
    access_code: string;
    reference: string;
}

export interface IPaystackInitializePayload {
    email: string;
    amount: string;
    channels?: string[];
    currency?: string;
    callback_url?: string;
    metadata?: any
}

export interface IPaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        domain: string;
        status: string; // "success", "failed", "abandoned"
        reference: string;
        receipt_number: string | null;
        amount: number;
        message: string | null;
        gateway_response: string;
        currency: string;
        channel: string;
        paidAt: string;
        createdAt: string;
        ip_address: string;
        metadata: any;
        log: {
            start_time: number;
            time_spent: number;
            attempts: number;
            errors: number;
            success: boolean;
            mobile: boolean;
            input: any[];
            history: any[];
        };
        fees: number;
        fees_split: any;
        authorization: {
            authorization_code: string;
            bin: string;
            last4: string;
            exp_month: string;
            exp_year: string;
            channel: string;
            card_type: string;
            bank: string;
            country_code: string;
            brand: string;
            reusable: boolean;
            signature: string;
            account_name: string | null;
        };
        customer: {
            id: number;
            first_name: string | null;
            last_name: string | null;
            email: string;
            customer_code: string;
            phone: string | null;
            metadata: string | null;
            risk_action: string;
            international_format_phone: string | null;
        };
        plan: any;
        split: any;
        order_id: any;
        requested_amount: number;
        pos_transaction_data: any;
        source: any;
        fees_breakdown: any;
        connect: any;
        transaction_date: string;
        plan_object: any;
        subaccount: any;
    };
}

export interface IGetUserOrdersPayload extends IBaseQueryDTO {
    status?: TOrderStatus;
    search?: string;
    branchId?: number;
    businessId?: number;
    owner?: number;
    // amenity?: TAmenityCategory;
}

export interface IOrderSummary {
    id: string;
    orderId: string;
    status: TOrderStatus;
    paymentStatus: TOrderPaymentStatus;
    amounts: {
        subTotal: number;
        discount: number;
        total: number;
    };
    createdAt: Date;
    branch: {
        id: number;
        name: string;
        city: string | null;
        streetAddress: string | null;
    };
    items: IOrderItemSummary[];
    amenitiesCategory: string[];
}

export interface IOrderItemSummary {
    id: string;
    quantity: number;
    amount: number;
    totalAmount: number;
    product: {
        id: number;
        name: string;
        description: string;
        price: number;
        currency: string;
        amenity: {
            id: string;
            name: string;
        };
    };
}

