"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const jwtUtil = __importStar(require("../utils/jwtUtil"));
const models_1 = __importDefault(require("../models"));
const Branch_1 = require("../models/Branch");
const profile_types_1 = require("../models/types/profile.types");
const helpers_1 = require("../utils/helpers");
const Profile_1 = require("../models/Profile");
const { sequelize } = models_1.default;
class ProfileService {
    static async createProfile(payload, userId) {
        const t = await sequelize.transaction();
        try {
            const data = {};
            const branch = {};
            console.log('profile type--', payload.profileType);
            switch (payload.profileType) {
                case profile_types_1.ProfileType.PERSONAL:
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
                case profile_types_1.ProfileType.BUSINESS:
                    data.userName = payload.userName;
                    data.businessCategory = payload.businessCategory;
                    data.fullAddress = payload.fullAddress;
                    data.streetAddress = payload.streetAddress;
                    data.state = payload.state;
                    data.country = payload.country;
                    data.city = payload.city;
                    const parsedLocation = (0, helpers_1.validateGeolocation)(payload.geoLocation);
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
            const profile = await Profile_1.Profile.create({ userId, ...data }, { transaction: t });
            branch.profileId = profile.id;
            if (payload.profileType === profile_types_1.ProfileType.BUSINESS) {
                await Branch_1.Branch.create({ ...branch }, { transaction: t });
            }
            await t.commit();
            const auth = {
                user: userId,
                profile: profile ? { id: profile.id, type: profile.profileType } : null,
                branch: branch.id
            };
            const token = jwtUtil.generateToken(auth);
            return {
                profile,
                token
            };
        }
        catch (error) {
            console.error("error creating profile---", error);
            await t.rollback();
            throw new Error(error.message || "Failed to create profile");
        }
    }
}
exports.ProfileService = ProfileService;
