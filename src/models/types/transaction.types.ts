export const TransactionStatus = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUNDED: 'refunded'
} as const;

export type TTransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

export const PaymentMethod = {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    BANK: 'bank',
    USSD: 'ussd'
} as const;

export type TPaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentProvider = {
    PAYSTACK: 'paystack'
} as const;

export type TPaymentProvider = typeof PaymentProvider[keyof typeof PaymentProvider];