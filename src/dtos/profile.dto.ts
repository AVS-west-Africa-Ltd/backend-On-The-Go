import { TBusinessCategory, TProfileType } from "../models/types/profile.types";

export interface ICreateProfileDTO {
  userName: string;
  streetAddress?: string;
  fullAddress?: string;
  state?: string;
  city?: string;
  country?: string;
   geoLocation?: {
        type: "Point";
        coordinates: [number, number];
    };
  profileType?: TProfileType;
  bio?: string;
  profession?: string;
  skills?: string[] | string;
  gender?: string;
  amenities?: any[];
  cacNo?: string;
  interests?: string[] | string;
  placesVisited?: string[] | string;
  occupation?: string;
  businessCategory?: TBusinessCategory;
}

export interface ProfileData {
    userName: string;
  streetAddress?: string;
  fullAddress?: string;
  state?: string;
  city?: string;
  country?: string;
  bio?: string;
  gender?: string;
  profileType: TProfileType;
  picture?: string | null;
  geoLocation?: {
    type: "Point";
    coordinates: [number, number];
  };
  skills?: string[];
  interests?: string[];
  placesVisited?: string[];
  businessCategory?: TBusinessCategory | null;
  cacNo?: string;
  profession?: string;
  amenities?: string[];
}
