import { Transaction } from "sequelize";
import * as jwtUtil from "../utils/jwtUtil";
import db from "../models";
import { ICreateProfilePayload, ICreateProfileResponse } from "./interfaces/profile.interface";
import { ProfileData } from "../dtos/profile.dto";
import { Branch } from "../models/Branch";
import { ProfileType } from "../models/types/profile.types";
import { validateGeolocation } from "../utils/helpers";
import { Profile } from "../models/Profile";

const { sequelize } = db;

export class ProfileService {

    static async createProfile(payload: ICreateProfilePayload, userId: number): Promise<ICreateProfileResponse> {
        const t: Transaction = await sequelize.transaction();

        try {
            const data: ProfileData = {} as ProfileData;
            const branch = {} as Branch;

            console.log('profile type--', payload.profileType);
            

            switch (payload.profileType) {
                case ProfileType.PERSONAL:
                    data.userName = payload.userName;
                    data.profession = payload.profession;
                    data.skills = Array.isArray(payload.skills)
                        ? payload.skills
                        : JSON.parse(payload.skills || "[]");
                    data.gender = payload.gender;
                    data.bio = payload.bio;
                    data.picture = payload.pictureLocation;
                    data.profileType = payload.profileType;
                    data.interests = Array.isArray(payload.interests)
                        ? payload.interests
                        : JSON.parse(payload.interests || "[]"),
                        data.placesVisited = Array.isArray(payload.placesVisited)
                            ? payload.placesVisited
                            : JSON.parse(payload.placesVisited || "[]");
                    break;


                case ProfileType.BUSINESS:
                    data.userName = payload.userName;
                    data.businessCategory = payload.businessCategory;
                    data.fullAddress = payload.fullAddress;
                    data.streetAddress = payload.streetAddress;
                    data.state = payload.state;
                    data.country = payload.country;
                    data.city = payload.city;
                    const parsedLocation = validateGeolocation(payload.geoLocation);
                    if (parsedLocation && parsedLocation.length == 2) {
                        data.geoLocation = {
                            type: "Point",
                            coordinates: parsedLocation
                        };
                    }
                    data.profileType = payload.profileType;
                    data.cacNo = payload.cacNo;
                    data.picture = payload.pictureLocation;

                    branch.name = `${data.userName} ( HQ ${data.city} ${data.state})`;
                    branch.streetAddress = data.streetAddress ?? null;
                    branch.fullAddress = data.fullAddress ?? null;
                    branch.state = data.state ?? null;
                    branch.country = data.country ?? null;
                    branch.city = data.city ?? null;
                    branch.geoLocation = data.geoLocation ?? null;
                    branch.isHQ = true;
                    break;
                default:
                    await t.rollback();
                    throw new Error("Invalid profile type selected.");
            }

            const profile = await Profile.create(
                { userId, ...data },
                { transaction: t }
            );

            branch.profileId = profile.id;
            let branchId = null;

            if (payload.profileType === ProfileType.BUSINESS) {
                const createdBranch = await Branch.create(
                    { ...branch },
                    { transaction: t }
                );
                branchId = createdBranch.id;
            }

            await t.commit();

            const auth = {
                user: userId,
                profile: profile ? { id: profile.id, type: profile.profileType } : null,
                branch: branchId ? branchId : branch.id
            };

            const token = jwtUtil.generateToken(auth);

            return {
                profile,
                token
            }
        } catch (error: any) {
            console.error("error creating profile---", error);
            
            await t.rollback();
            throw new Error(error.message || "Failed to create profile");
        }
    }
}