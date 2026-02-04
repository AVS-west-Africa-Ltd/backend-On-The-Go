export interface IGetCustomersPayload {
    cursor?: string;
    limit?: number | string;
    search?: string;
    from?: string;
    to?: string;
    branchId: number;
}