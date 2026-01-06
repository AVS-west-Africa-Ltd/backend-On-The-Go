import { Profile } from "../models/Profile";
import { TBusinessCategory, TProfileType } from "../models/types/profile.types";

export interface ICreateProfilePayload {
    userName: string;
    streetAddress?: string;
    fullAddress?: string;
    state?: string;
    country?: string;
    city?: string;
    geoLocation?: {
        type: "Point";
        coordinates: [number, number];
    };
    profileType?: TProfileType;
    bio?: string;
    profession?: string;
    skills?: string[] | string;
    gender?: string;
    cacNo?: string;
    interests?: string[] | string;
    placesVisited?: string[] | string;
    businessCategory?: TBusinessCategory | null;
    pictureLocation?: string;
}

export interface ICreateProfileResponse {
    profile: Profile;
    token: string;
}