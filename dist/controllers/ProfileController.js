"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProfile = exports.updateProfile = exports.addRedeemRewardHours = exports.addWifiDetails = exports.addSocials = exports.addPhotos = exports.addAmenities = exports.addOpeningHours = exports.uploadDocument = exports.addInterestsAndPlaces = exports.addMoreInfomation = exports.createProfile = void 0;
const Amenity_1 = require("../models/Amenity");
const Profile_1 = require("../models/Profile");
const Document_1 = require("../models/Document");
const OpeningHour_1 = require("../models/OpeningHour");
const User_1 = require("../models/User");
const Social_1 = require("../models/Social");
const Post_1 = require("../models/Post");
const Media_1 = require("../models/Media");
const Branch_1 = require("../models/Branch");
const RewardRedeemHour_1 = require("../models/RewardRedeemHour");
const index_1 = __importDefault(require("../models/index"));
const profile_types_1 = require("../models/types/profile.types");
const responseHandlers_1 = require("../handlers/responseHandlers");
const BranchAmenity_1 = require("../models/BranchAmenity");
const amenity_types_1 = require("../models/types/amenity.types");
const profile_service_1 = require("../services/profile.service");
const media_types_1 = require("../models/types/media.types");
const { sequelize } = index_1.default;
const createProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const data = req.body;
        const branch = {};
        const userId = req.user;
        const { profile, token } = await profile_service_1.ProfileService.createProfile(data, userId);
        return res
            .status(200)
            .json({ profile, token, message: "Profile created successfully!" });
    }
    catch (error) {
        console.error("Profile creation failed:", error);
        await t.rollback();
        return res.status(400).json({ message: "Something went wrong!" });
    }
};
exports.createProfile = createProfile;
const addMoreInfomation = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { bio, businessType, website } = req.body;
        const profileId = req.profile.id;
        const userId = req.user;
        const profile = await Profile_1.Profile.findOne({
            where: { userId, id: profileId, profileType: profile_types_1.ProfileType.BUSINESS },
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!profile) {
            await t.rollback();
            return (0, responseHandlers_1.errorHandler)(res, "Profile not found!", 400);
        }
        await profile.update({ bio, businessType, website }, { transaction: t });
        await t.commit();
        return res.status(200).json({ message: "Perfect more information added!" });
    }
    catch (error) {
        await t.rollback();
        res.status(400).json({ message: "Sorry adding more information failed!" });
    }
};
exports.addMoreInfomation = addMoreInfomation;
const addInterestsAndPlaces = async (req, res) => {
    try {
        const profileId = req.profile.id;
        const userId = req.user;
        let { interests = [], placesVisited = [] } = req.body;
        if (!Array.isArray(interests)) {
            try {
                interests = JSON.parse(interests);
            }
            catch {
                interests = [];
            }
        }
        if (!Array.isArray(placesVisited)) {
            try {
                placesVisited = JSON.parse(placesVisited);
            }
            catch {
                placesVisited = [];
            }
        }
        const [updated] = await Profile_1.Profile.update({ interests, placesVisited }, { where: { id: profileId, userId } });
        if (updated === 0) {
            return res.status(400).json({ message: "Sorry no attached profile!" });
        }
        const profile = await Profile_1.Profile.findOne({
            where: { id: profileId, userId }
        });
        return res.status(200).json({
            profile,
            message: "Wow profile updated successfully!"
        });
    }
    catch (error) {
        return res.status(400).json({
            message: "Sorry interest & places update failed"
        });
    }
};
exports.addInterestsAndPlaces = addInterestsAndPlaces;
const uploadDocument = async (req, res) => {
    try {
        const { documentType } = req.body;
        const document = await Document_1.Document.create({
            profileId: req.profile.id,
            documentType: documentType,
            fileUrl: req.file?.location || "",
            fileKey: req.file?.key || null
        });
        res.status(200).json({ document, message: "Document uploaded successfilly!" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: "Sorry something went wrong!" });
    }
};
exports.uploadDocument = uploadDocument;
const addOpeningHours = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { hours } = req.body;
        const branchId = req.params.branchId;
        if (!Array.isArray(hours))
            return res.status(400).json({ message: "Sorry hours not in right format" });
        await OpeningHour_1.OpeningHour.destroy({ where: { businessId: req.profile.id, branchId: branchId } });
        const openingHours = await Promise.all(hours.map(async (hour) => {
            const count = hours.length;
            if (count > 7) {
                throw new Error("A business can only have up to 7 opening days");
            }
            return await OpeningHour_1.OpeningHour.create({
                businessId: req.profile.id,
                branchId: Number(branchId),
                dayOfWeek: hour.dayOfWeek,
                openTime: hour.openTime,
                closeTime: hour.closeTime,
            }, { transaction: t });
        }));
        await t.commit();
        return res.status(200).json({ openingHours, message: "Added opening hours successfilly!" });
    }
    catch (error) {
        console.log(error);
        await t.rollback();
        res.status(400).json({ message: "Sorry something went wrong!" });
    }
};
exports.addOpeningHours = addOpeningHours;
const addAmenities = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { amenities } = req.body;
        const profileId = req.profile.id;
        const branchId = req.branch;
        const userId = req.user;
        const branch = await Branch_1.Branch.findOne({
            where: { id: branchId, profileId },
            transaction: t,
            lock: t.LOCK.UPDATE
        });
        if (!branch) {
            await t.rollback();
            return res.status(400).json({ message: "Branch not found!" });
        }
        let parsedAmenities = amenities;
        if (!Array.isArray(parsedAmenities)) {
            try {
                parsedAmenities = JSON.parse(parsedAmenities || "[]");
            }
            catch {
                parsedAmenities = [];
            }
        }
        if (parsedAmenities.length > 0) {
            const rows = parsedAmenities.map((name) => ({
                userId,
                businessId: profileId,
                branchId,
                name
            }));
            await Amenity_1.Amenity.bulkCreate(rows, {
                updateOnDuplicate: ["updatedAt"],
                transaction: t
            });
        }
        await t.commit();
        return res.status(200).json({
            message: "Amenities added successfully!"
        });
    }
    catch (error) {
        console.log(error);
        await t.rollback();
        return res.status(400).json({
            message: "Sorry adding amenities failed!"
        });
    }
};
exports.addAmenities = addAmenities;
const addPhotos = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { targetType, targetId } = req.body;
        // const files = req.files;
        // const files = Array.isArray(req.files) ? req.files : [];
        const files = Array.isArray(req.files) ? req.files : [];
        const userId = req.user;
        if (!targetType || !targetId) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Target type and target ID are required"
            });
        }
        if (!files || files.length === 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: "No files uploaded"
            });
        }
        const validTargetTypes = ['profile', 'post', 'product'];
        if (!validTargetTypes.includes(targetType)) {
            await transaction.rollback();
            return res.status(400).json({
                message: `Invalid target type. Must be one of: ${Object.values(media_types_1.MediaTargetTypes).join(', ')}`
            });
        }
        const mediaEntries = files.map((file, index) => ({
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
        console.log(mediaEntries);
        const createdMedia = await Media_1.Media.bulkCreate(mediaEntries, {
            transaction,
            returning: true,
            validate: true
        });
        await transaction.commit();
        return res.status(201).json({
            createdMedia,
            message: `Successfully uploaded ${createdMedia.length} photo(s)`,
        });
    }
    catch (error) {
        await transaction.rollback();
        console.error('Photo upload error:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation failed for uploaded files',
                errors: error.errors.map((err) => err.message)
            });
        }
        return res.status(500).json({
            message: 'Sorry failed to upload photos',
        });
    }
};
exports.addPhotos = addPhotos;
const addSocials = async (req, res) => {
    try {
        const { socials = {} } = req.body;
        const { profile, user: userId } = req;
        if (!socials || Object.keys(socials).length === 0) {
            return res.status(400).json({
                message: "Socials data is required"
            });
        }
        const socialEntries = Object.entries(socials).map(([platform, url]) => {
            const normalized = platform.toLowerCase().trim();
            return {
                userId,
                profileId: profile.id,
                platform: normalized,
                url: url.trim(),
            };
        });
        const createdSocials = await Social_1.Social.bulkCreate(socialEntries, {
            updateOnDuplicate: ["url", "updatedAt"],
            returning: true,
        });
        return res.status(200).json({
            data: createdSocials,
            message: "Social media links updated successfully",
            count: createdSocials.length
        });
    }
    catch (error) {
        console.error("Error adding socials:", error);
        return res.status(500).json({
            message: "Failed to update social media links",
        });
    }
};
exports.addSocials = addSocials;
const addWifiDetails = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name, password } = req.body;
        if (!name || !password) {
            await t.rollback();
            return res.status(400).json({ message: "WiFi name and password are required." });
        }
        const amenity = await Amenity_1.Amenity.findOne({
            where: { name: "wifi" },
            transaction: t
        });
        if (!amenity) {
            await t.rollback();
            return res.status(400).json({ message: "WiFi amenity not found!" });
        }
        const branchAmenity = await BranchAmenity_1.BranchAmenity.findOne({
            where: {
                businessId: req.profile.id,
                branchId: req.branch,
                amenityId: amenity?.id
            },
            transaction: t
        });
        if (!branchAmenity) {
            await t.rollback();
            return res.status(400).json({ message: "You have not added the WiFi amenity to this branch" });
        }
        const wifiDetails = { name, password };
        branchAmenity.meta = wifiDetails;
        await branchAmenity.save({ transaction: t });
        await t.commit();
        return res.status(200).json({
            amenity,
            message: "WiFi details added successfully!",
        });
    }
    catch (error) {
        console.error("addWifiDetails error:", error);
        await t.rollback();
        return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};
exports.addWifiDetails = addWifiDetails;
const addRedeemRewardHours = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { hours } = req.body;
        const { profile } = req;
        if (!Array.isArray(hours)) {
            return res.status(400).json({
                message: "Hours data must be provided as an array"
            });
        }
        if (hours.length === 0) {
            return res.status(400).json({
                message: "At least one operating hour entry is required"
            });
        }
        if (hours.length > 7) {
            return res.status(400).json({
                message: "Maximum 7 operating days allowed per business"
            });
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
            await transaction.rollback();
            return res.status(400).json({
                message: "Sorry invalid hours data provided",
            });
        }
        await RewardRedeemHour_1.RewardRedeemHour.destroy({
            where: { businessId: profile.id },
            transaction
        });
        const rewardRedeemHours = await RewardRedeemHour_1.RewardRedeemHour.bulkCreate(hours.map(hour => ({
            businessId: profile.id,
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
        })), { transaction });
        await transaction.commit();
        return res.status(200).json({
            data: rewardRedeemHours,
            message: "Reward redeem hours updated successfully",
        });
    }
    catch (error) {
        await transaction.rollback();
        console.error("Error updating reward redeem hours:", error);
        return res.status(400).json({
            message: "Failed to update reward redeem hours",
        });
    }
};
exports.addRedeemRewardHours = addRedeemRewardHours;
const updateProfile = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { userName, businessType = "", address = "", bio, profession = "", skills = [], amenities = [], } = req.body;
        const userId = req.user;
        const selectedProfile = req.profile;
        const profile = await Profile_1.Profile.findOne({
            where: { id: selectedProfile.id, userId, profileType: selectedProfile.type },
            transaction: t,
        });
        if (!profile) {
            await t.rollback();
            return res.status(400).json({ message: "Sorry, can't locate profile!" });
        }
        switch (selectedProfile.type) {
            case profile_types_1.ProfileType.PERSONAL:
                profile.userName = userName || profile.userName;
                profile.profession = profession || profile.profession;
                profile.skills = skills
                    ? Array.isArray(skills)
                        ? skills
                        : JSON.parse(skills || "[]")
                    : profile.skills;
                profile.bio = bio || profile.bio;
                profile.picture = req.file?.location || profile.picture;
                profile.streetAddress = address || profile.streetAddress;
                break;
            case profile_types_1.ProfileType.BUSINESS:
                profile.userName = userName || profile.userName;
                profile.businessType = businessType || profile.businessType;
                profile.streetAddress = address || profile.streetAddress;
                profile.bio = bio || profile.bio;
                profile.picture = req.file?.location || profile.picture;
                break;
            default:
                await t.rollback();
                return res.status(400).json({ message: "Invalid profile type!" });
        }
        await profile.save({ transaction: t });
        const parsedAmenities = Array.isArray(amenities)
            ? amenities
            : JSON.parse(amenities || "[]");
        if (selectedProfile.type === profile_types_1.ProfileType.BUSINESS && parsedAmenities.length > 0) {
            for (const amenity of parsedAmenities) {
                await BranchAmenity_1.BranchAmenity.upsert({
                    businessId: profile.id,
                    branchId: req.branch,
                    amenityId: amenity.id,
                    status: amenity.status ?? amenity_types_1.Status.ACTIVE,
                    meta: amenity.meta ?? null,
                }, { transaction: t });
            }
        }
        await t.commit();
        return res.status(200).json({ profile, message: "Profile updated successfully!" });
    }
    catch (error) {
        console.log(error);
        await t.rollback();
        return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};
exports.updateProfile = updateProfile;
const fetchProfile = async (req, res) => {
    try {
        const user = req.user;
        const selectedProfile = req.profile;
        if (!selectedProfile) {
            return res.status(400).json({ success: false, message: "No profile selected." });
        }
        const includes = [];
        switch (selectedProfile.type) {
            case profile_types_1.ProfileType.PERSONAL:
                includes.push({
                    model: User_1.User,
                    as: "user",
                    attributes: ["id", "email", "firstName", "lastName"],
                });
                includes.push({
                    model: Post_1.Post,
                    as: "reviews",
                    where: {
                        postType: "review",
                    },
                    required: false,
                });
                includes.push({
                    model: Post_1.Post,
                    as: "posts",
                    where: {
                        postType: "normal",
                    },
                    required: false,
                });
                break;
            case "business":
                includes.push({
                    model: User_1.User,
                    as: "user",
                    attributes: ["id", "email", "firstName", "lastName"],
                });
                includes.push({
                    model: Amenity_1.Amenity,
                    as: "amenities",
                });
                includes.push({
                    model: Social_1.Social,
                    as: "socials",
                });
                includes.push({
                    model: Post_1.Post,
                    as: "posts",
                    where: {
                        postType: "normal",
                    },
                    required: false,
                });
                break;
            default:
                return res.status(400).json({ message: "Sorry select a profile!" });
                break;
        }
        const profile = await Profile_1.Profile.findOne({
            where: { id: selectedProfile.id, userId: user },
            include: includes,
        });
        // profile["recentVisits"] = [];
        res.status(200).json({ profile, message: "Profile fetched flushed!" });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: "Sorry something went wrong!" });
    }
};
exports.fetchProfile = fetchProfile;
