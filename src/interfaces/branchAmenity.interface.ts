import { TStatus } from "../../models/types/amenity.types";

export interface IBranchAmenityPayload {
    amenityId: string;
    status?: TStatus;
    meta?: Record<string, unknown>;
}