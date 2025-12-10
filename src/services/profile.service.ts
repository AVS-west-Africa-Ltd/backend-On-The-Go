import { Transaction } from "sequelize";
import * as jwtUtil from "../utils/jwtUtil";
import db from "../models";
import { ICreateProfilePayload, ICreateProfileResponse } from "./interfaces/profile.interface";
import { ProfileData } from "../dtos/profile.dto";
import { Branch } from "../models/Branch";
import { ProfileType } from "../models/types/profile.types";
import { validateGeolocation } from "../utils/helpers";
import { Profile } from "../models/Profile";
import { Document, DocumentType } from "../models/Document";
import { OpeningHour } from "../models/OpeningHour";
import { Amenity } from "../models/Amenity";
import { BranchAmenity } from "../models/BranchAmenity";
import { Media } from "../models/Media";
import { Social } from "../models/Social";
import { RewardRedeemHour } from "../models/RewardRedeemHour";
import { Status } from "../models/types/amenity.types";
import { MediaTargetTypes } from "../models/types/media.types";
import { TAllowedSocialPlatforms } from "../models/types/socials.types";
import { User } from "../models/User";
import { Post } from "../models/Post";

const { sequelize } = db;

export class ProfileService {

    static async createProfile(payload: ICreateProfilePayload, userId: number): Promise<ICreateProfileResponse> {
        const t: Transaction = await sequelize.transaction();

        try {
            const data: ProfileData = {} as ProfileData;
            const branch = {} as Branch;

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

    static async addMoreInformation(data: any, userId: number, profileId: number) {
        const t = await sequelize.transaction();
        try {
            const { bio, businessType, website } = data;

            const profile = await Profile.findOne({
                where: { userId, id: profileId, profileType: ProfileType.BUSINESS },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!profile) {
                throw new Error("Profile not found!");
            }

            await profile.update(
                { bio, businessType, website },
                { transaction: t }
            );

            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async addInterestsAndPlaces(data: any, userId: number, profileId: number) {
        let { interests = [], placesVisited = [] } = data;

        if (!Array.isArray(interests)) {
            try { interests = JSON.parse(interests); } catch { interests = []; }
        }

        if (!Array.isArray(placesVisited)) {
            try { placesVisited = JSON.parse(placesVisited); } catch { placesVisited = []; }
        }

        const [updated] = await Profile.update(
            { interests, placesVisited },
            { where: { id: profileId, userId } }
        );

        if (updated === 0) {
            throw new Error("Sorry no attached profile!");
        }

        const profile = await Profile.findOne({
            where: { id: profileId, userId }
        });

        return profile;
    }

    static async uploadDocument(documentType: string, file: any, profileId: number) {
        const document = await Document.create({
            profileId,
            documentType: documentType as DocumentType,
            fileUrl: file?.location || "",
            fileKey: file?.key || null
        });
        return document;
    }

    static async addOpeningHours(hours: any[], branchId: string, profileId: number) {
        const t = await sequelize.transaction();
        try {
            if (!Array.isArray(hours)) throw new Error("Sorry hours not in right format");

            await OpeningHour.destroy({ where: { businessId: profileId, branchId: branchId }, transaction: t });

            const openingHours = await Promise.all(hours.map(async (hour) => {
                const count = hours.length;
                if (count > 7) {
                    throw new Error("A business can only have up to 7 opening days");
                }
                return await OpeningHour.create({
                    businessId: profileId,
                    branchId: Number(branchId),
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                }, { transaction: t });
            }));

            await t.commit();
            return openingHours;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async addAmenities(amenities: any, userId: number, profileId: number, branchId: number) {
        const t = await sequelize.transaction();
        try {
            const branch = await Branch.findOne({
                where: { id: branchId, profileId },
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (!branch) {
                throw new Error("Branch not found!");
            }

            let parsedAmenities = amenities;

            if (!Array.isArray(parsedAmenities)) {
                try {
                    parsedAmenities = JSON.parse(parsedAmenities || "[]");
                } catch {
                    parsedAmenities = [];
                }
            }

            if (parsedAmenities.length > 0) {
                const rows = parsedAmenities.map((name: string) => ({
                    userId,
                    businessId: profileId,
                    branchId,
                    name
                }));

                await Amenity.bulkCreate(rows, {
                    updateOnDuplicate: ["updatedAt"],
                    transaction: t
                });
            }
            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async addPhotos(targetType: string, targetId: string, files: Express.Multer.File[], userId: number) {
        const transaction = await sequelize.transaction();
        try {
            if (!targetType || !targetId) {
                throw new Error("Target type and target ID are required");
            }

            if (!files || files.length === 0) {
                throw new Error("No files uploaded");
            }

            const validTargetTypes = ['profile', 'post', 'product'];
            if (!validTargetTypes.includes(targetType)) {
                throw new Error(`Invalid target type. Must be one of: ${Object.values(MediaTargetTypes).join(', ')}`);
            }

            const mediaEntries = files.map((file: Express.Multer.File, index: number) => ({
                targetId: parseInt(targetId),
                targetType,
                userId,
                filePath: file.location || "",
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                metadata: {
                    s3Key: file.key,
                    bucket: file.bucket,
                    etag: file.etag,
                    storageClass: file.storageClass,
                    contentDisposition: file.contentDisposition,
                },
                uploadOrder: index,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            const createdMedia = await Media.bulkCreate(mediaEntries as any, {
                transaction,
                returning: true,
                validate: true
            });

            await transaction.commit();
            return createdMedia;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async addSocials(socials: any, userId: number, profileId: number) {
        if (!socials || Object.keys(socials).length === 0) {
            throw new Error("Socials data is required");
        }

        const socialEntries = Object.entries(socials).map(([platform, url]) => {
            const normalized = platform.toLowerCase().trim();
            return {
                userId,
                profileId: profileId,
                platform: normalized as TAllowedSocialPlatforms,
                url: (url as string).trim(),
            }
        });

        const createdSocials = await Social.bulkCreate(socialEntries, {
            updateOnDuplicate: ["url", "updatedAt"],
            returning: true,
        });

        return createdSocials;
    }

    static async addWifiDetails(data: any, branchId: number, profileId: number) {
        const t = await sequelize.transaction();
        try {
            const { name, password } = data;
            if (!name || !password) {
                throw new Error("WiFi name and password are required.");
            }

            const amenity = await Amenity.findOne({
                where: { name: "wifi" },
                transaction: t
            });

            if (!amenity) {
                throw new Error("WiFi amenity not found!");
            }

            const branchAmenity = await BranchAmenity.findOne({
                where: {
                    businessId: profileId,
                    branchId: branchId,
                    amenityId: amenity?.id
                },
                transaction: t
            });

            if (!branchAmenity) {
                throw new Error("You have not added the WiFi amenity to this branch");
            }

            branchAmenity.meta = { name, password };
            await branchAmenity.save({ transaction: t });
            await t.commit();

            return amenity;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async addRedeemRewardHours(hours: any[], profileId: number) {
        const transaction = await sequelize.transaction();
        try {
            if (!Array.isArray(hours)) {
                throw new Error("Hours data must be provided as an array");
            }
            if (hours.length === 0) {
                throw new Error("At least one operating hour entry is required");
            }
            if (hours.length > 7) {
                throw new Error("Maximum 7 operating days allowed per business");
            }

            const validationErrors = [];
            const seenDays = new Set();

            hours.forEach((hour, index) => {
                if (!hour.dayOfWeek || hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
                    validationErrors.push(`Entry ${index + 1}: dayOfWeek must be between 0-6`);
                }

                if (seenDays.has(hour.dayOfWeek)) {
                    validationErrors.push(`Entry ${index + 1}: duplicate dayOfWeek ${hour.dayOfWeek}`);
                }
                seenDays.add(hour.dayOfWeek);

                if (!hour.openTime || !hour.closeTime) {
                    validationErrors.push(`Entry ${index + 1}: openTime and closeTime are required`);
                }
            });

            if (validationErrors.length > 0) {
                throw new Error("Sorry invalid hours data provided");
            }

            await RewardRedeemHour.destroy({
                where: { businessId: profileId },
                transaction
            });

            const rewardRedeemHours = await RewardRedeemHour.bulkCreate(
                hours.map(hour => ({
                    businessId: profileId,
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                })),
                { transaction }
            );

            await transaction.commit();
            return rewardRedeemHours;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    static async updateProfile(data: any, userId: number, selectedProfile: any, file: any, branchId: number) {
        const t = await sequelize.transaction();
        try {
            const {
                userName,
                businessType = "",
                address = "",
                bio,
                profession = "",
                skills = [],
                amenities = [],
            } = data;

            const profile = await Profile.findOne({
                where: { id: selectedProfile!.id, userId, profileType: selectedProfile!.type },
                transaction: t,
            });

            if (!profile) {
                throw new Error("Sorry, can't locate profile!");
            }

            switch (selectedProfile!.type) {
                case ProfileType.PERSONAL:
                    profile.userName = userName || profile.userName;
                    profile.profession = profession || profile.profession;
                    profile.skills = skills
                        ? Array.isArray(skills)
                            ? skills
                            : JSON.parse(skills || "[]")
                        : profile.skills;
                    profile.bio = bio || profile.bio;
                    profile.picture = file?.location || profile.picture;
                    profile.streetAddress = address || profile.streetAddress;
                    break;

                case ProfileType.BUSINESS:
                    profile.userName = userName || profile.userName;
                    profile.businessType = businessType || profile.businessType;
                    profile.streetAddress = address || profile.streetAddress;
                    profile.bio = bio || profile.bio;
                    profile.picture = file?.location || profile.picture;
                    break;

                default:
                    throw new Error("Invalid profile type!");
            }

            await profile.save({ transaction: t });

            const parsedAmenities = Array.isArray(amenities)
                ? amenities
                : JSON.parse(amenities || "[]");

            if (selectedProfile!.type === ProfileType.BUSINESS && parsedAmenities.length > 0) {
                for (const amenity of parsedAmenities) {
                    await BranchAmenity.upsert(
                        {
                            businessId: profile!.id,
                            branchId: branchId,
                            amenityId: amenity.id,
                            status: amenity.status ?? Status.ACTIVE,
                            meta: amenity.meta ?? null,
                        },
                        { transaction: t }
                    );
                }
            }

            await t.commit();
            return profile;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async fetchProfile(selectedProfile: any, userId: number) {
        if (!selectedProfile) {
            throw new Error("No profile selected.");
        }

        const includes = [];

        switch (selectedProfile.type) {
            case ProfileType.PERSONAL:
                includes.push({
                    model: User,
                    as: "user",
                    attributes: ["id", "email", "firstName", "lastName"],
                });
                includes.push({
                    model: Post,
                    as: "reviews",
                    where: {
                        postType: "review",
                    },
                    required: false,
                },);
                includes.push({
                    model: Post,
                    as: "posts",
                    where: {
                        postType: "normal",
                    },
                    required: false,
                },);
                break;

            case "business":
                includes.push({
                    model: User,
                    as: "user",
                    attributes: ["id", "email", "firstName", "lastName"],
                });
                includes.push({
                    model: Amenity,
                    as: "amenities",
                });
                includes.push({
                    model: Social,
                    as: "socials",
                });
                includes.push({
                    model: Post,
                    as: "posts",
                    where: {
                        postType: "normal",
                    },
                    required: false,
                },);
                break;

            default:
                throw new Error("Sorry select a profile!");
        }

        const profile = await Profile.findOne({
            where: { id: selectedProfile.id, userId },
            include: includes,
        });

        return profile;
    }
}