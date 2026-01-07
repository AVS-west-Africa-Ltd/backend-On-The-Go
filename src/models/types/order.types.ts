export const OrderPaymentStatus = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed'
} as const;

export type TOrderPaymentStatus = typeof OrderPaymentStatus[keyof typeof OrderPaymentStatus];

export const OrderStatus = {
    NEW: 'new',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
} as const;

export type TOrderStatus = typeof OrderStatus[keyof typeof OrderStatus];