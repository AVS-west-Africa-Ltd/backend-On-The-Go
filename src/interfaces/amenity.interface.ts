export interface ICreateAmenityPayload {
    name: string;
    meta?: Record<string, unknown>;
}

export interface IUpdateAmenityPayload {
    name?: string;
    meta?: Record<string, unknown>;
}
