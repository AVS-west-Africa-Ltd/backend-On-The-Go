export enum PAYSTACK_EVENT {
    CHARGE_SUCCESS = 'charge.success',
}

export enum PAYMENT_EVENT {
    PAYSTACK_WEBHOOK = 'paystack.webhook',
}

export enum STAFF_EVENT {
    STAFF_INVITED = 'staff.invited',
    STAFF_ADMIN_CREATED = 'staff.admin.created',
    STAFF_AUTO_ACCEPT = 'staff.auto_accept',
}

export enum REWARD_EVENT {
    REVIEW_CREATED = 'reward.review.created',
    RULE_CREATED = 'reward.rule.created',
}

export enum BRANCH_EVENT {
    BRANCH_CREATED = 'branch.created',
}


export type TPaystackEventData = {
    id: number,
    domain: string,
    status: string,
    reference: string,
    amount: number,
    message: string,
    gateway_response: string,
    paid_at: string,
    created_at: string,
    channel: string,
    currency: string,
    ip_address: string,
    metadata: any,
    log: string,
    fees: string,
    fees_split: string,
    authorization: {
        authorization_code: string,
        bin: string,
        last4: string,
        exp_month: string,
        exp_year: string,
        channel: string,
        card_type: string,
        bank: string,
        country_code: string,
        brand: string,
        reusable: boolean,
        signature: string,
        account_name: string
    },
    customer: {
        id: number,
        first_name: string,
        last_name: string,
        email: string,
        customer_code: string,
        phone: string,
        metadata: string,
        risk_action: string
    },
    plan: any,
    subaccount: any,
    paidAt: string,
}

export type TRewardReviewEventData = {
    userId: number;
    businessId: number;
    branchId: number;
};

export type TBranchCreatedEventData = {
    profileId: number;
    branchId: number;
    name: string;
};

