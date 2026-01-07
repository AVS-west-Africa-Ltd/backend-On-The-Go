import { TPostTargetType, TPostType } from "../models/types/post.types";

export interface ICreatePostPayload {
    body: string;
    postType?: TPostType;
    target: number;
    branchId?: number;
    amenities?: string | Record<string, number>;
    targetType?: TPostTargetType;
    media?: string[];
}
