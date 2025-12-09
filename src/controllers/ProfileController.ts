import { Amenity } from "../models/Amenity";
import { Profile } from "../models/Profile";
import { Document } from "../models/Document";
import { OpeningHour } from "../models/OpeningHour";
import { User } from "../models/User";
import { Social } from "../models/Social";
import { Post } from "../models/Post";
import { Media } from "../models/Media";
import { Branch } from "../models/Branch";
import { RewardRedeemHour } from "../models/RewardRedeemHour";
import db from "../models/index";
import { Request, Response } from "express";
import { ICreateProfileDTO, ProfileData } from "../dtos/profile.dto";
import { ProfileType } from "../models/types/profile.types";
import { errorHandler } from "../handlers/responseHandlers";
import { TAllowedSocialPlatforms } from "../models/types/socials.types";
import { BranchAmenity } from "../models/BranchAmenity";
import { Status } from "../models/types/amenity.types";
import { ProfileService } from "../services/profile.service";
import { MediaTargetTypes } from "../models/types/media.types";


const { sequelize } = db;

export const createProfile = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const data = req.body as ICreateProfileDTO;

    const branch: Branch = {} as Branch;
    const userId = req.user!;


   const { profile, token } = await ProfileService.createProfile(data, userId);

    return res
      .status(200)
      .json({ profile, token, message: "Profile created successfully!" });

  } catch (error) {
    console.error("Profile creation failed:", error);
    await t.rollback()
    return res.status(400).json({ message: "Something went wrong!" });
  }
};

export const addMoreInfomation = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { bio, businessType, website } = req.body;
    const profileId = req.profile!.id;
    const userId = req.user;

    const profile = await Profile.findOne({
      where: { userId, id: profileId, profileType: ProfileType.BUSINESS },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!profile) {
      await t.rollback();
      return errorHandler(res, "Profile not found!", 400);
    }

    await profile.update(
      { bio, businessType, website },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({ message: "Perfect more information added!" });

  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: "Sorry adding more information failed!" });
  }
};

export const addInterestsAndPlaces = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const userId = req.user;

    let { interests = [], placesVisited = [] } = req.body;

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
      return res.status(400).json({ message: "Sorry no attached profile!" });
    }

    const profile = await Profile.findOne({
      where: { id: profileId, userId }
    });

    return res.status(200).json({
      profile,
      message: "Wow profile updated successfully!"
    });

  } catch (error) {
    return res.status(400).json({
      message: "Sorry interest & places update failed"
    });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { documentType } = req.body;

    const document = await Document.create({
      profileId: req.profile!.id,
      documentType: documentType,
      fileUrl: req.file?.location || "",
      fileKey: req.file?.key || null
    });

    res.status(200).json({ document, message: "Document uploaded successfilly!" });

  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Sorry something went wrong!" });
  }
};

export const addOpeningHours = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { hours } = req.body;
    const branchId = req.params.branchId;

    if (!Array.isArray(hours)) return res.status(400).json({ message: "Sorry hours not in right format" });

    await OpeningHour.destroy({ where: { businessId: req.profile!.id, branchId: branchId } });

    const openingHours = await Promise.all(hours.map(async (hour) => {
      const count = hours.length;
      if (count > 7) {
        throw new Error("A business can only have up to 7 opening days");
      }
      return await OpeningHour.create({
        businessId: req.profile!.id,
        branchId: Number(branchId),
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      }, { transaction: t });
    })
    );
    await t.commit();
    return res.status(200).json({ openingHours, message: "Added opening hours successfilly!" });

  } catch (error) {
    console.log(error);
    await t.rollback();
    res.status(400).json({ message: "Sorry something went wrong!" });
  }
};

export const addAmenities = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { amenities } = req.body;
    const profileId = req.profile!.id;
    const branchId = req.branch
    const userId = req.user;

    const branch = await Branch.findOne({
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

    return res.status(200).json({
      message: "Amenities added successfully!"
    });

  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({
      message: "Sorry adding amenities failed!"
    });
  }
};

export const addPhotos = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();

  try {
    const { targetType, targetId } = req.body;
    // const files = req.files;
    // const files = Array.isArray(req.files) ? req.files : [];
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];

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
        message: `Invalid target type. Must be one of: ${Object.values(MediaTargetTypes).join(', ')}`
      });
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

    console.log(mediaEntries);

    const createdMedia = await Media.bulkCreate(mediaEntries, {
      transaction,
      returning: true,
      validate: true
    });

    await transaction.commit();

    return res.status(201).json({
      createdMedia,
      message: `Successfully uploaded ${createdMedia.length} photo(s)`,
    });

  } catch (error: any) {
    await transaction.rollback();

    console.error('Photo upload error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed for uploaded files',
        errors: error.errors.map((err: any) => err.message)
      });
    }

    return res.status(500).json({
      message: 'Sorry failed to upload photos',
    });
  }
};

export const addSocials = async (req: Request, res: Response) => {
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
        profileId: profile!.id,
        platform: normalized as TAllowedSocialPlatforms,
        url: (url as string).trim(),
      }
    });

    const createdSocials = await Social.bulkCreate(socialEntries, {
      updateOnDuplicate: ["url", "updatedAt"],
      returning: true,
    });

    return res.status(200).json({
      data: createdSocials,
      message: "Social media links updated successfully",
      count: createdSocials.length
    });

  } catch (error) {
    console.error("Error adding socials:", error);
    return res.status(500).json({
      message: "Failed to update social media links",
    });
  }
};

export const addWifiDetails = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { name, password } = req.body;

    if (!name || !password) {
      await t.rollback();
      return res.status(400).json({ message: "WiFi name and password are required." });
    }

    const amenity = await Amenity.findOne({
      where: { name: "wifi" },
      transaction: t
    });

    if (!amenity) {
      await t.rollback();
      return res.status(400).json({ message: "WiFi amenity not found!" });
    }

    const branchAmenity = await BranchAmenity.findOne({
      where: {
        businessId: req.profile!.id,
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
  } catch (error) {
    console.error("addWifiDetails error:", error);
    await t.rollback();
    return res.status(400).json({ message: "Sorry, something went wrong!" });
  }
};

export const addRedeemRewardHours = async (req: Request, res: Response) => {
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


    await RewardRedeemHour.destroy({
      where: { businessId: profile!.id },
      transaction
    });

    const rewardRedeemHours = await RewardRedeemHour.bulkCreate(
      hours.map(hour => ({
        businessId: profile!.id,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
      })),
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      data: rewardRedeemHours,
      message: "Reward redeem hours updated successfully",
    });

  } catch (error) {
    await transaction.rollback();

    console.error("Error updating reward redeem hours:", error);

    return res.status(400).json({
      message: "Failed to update reward redeem hours",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
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
    } = req.body;

    const userId = req.user;
    const selectedProfile = req.profile;

    const profile = await Profile.findOne({
      where: { id: selectedProfile!.id, userId, profileType: selectedProfile!.type },
      transaction: t,
    });

    if (!profile) {
      await t.rollback();
      return res.status(400).json({ message: "Sorry, can't locate profile!" });
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
        profile.picture = req.file?.location || profile.picture;
        profile.streetAddress = address || profile.streetAddress;
        break;

      case ProfileType.BUSINESS:
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

    if (selectedProfile!.type === ProfileType.BUSINESS && parsedAmenities.length > 0) {
       for (const amenity of parsedAmenities) {
    await BranchAmenity.upsert(
      {
        businessId: profile!.id,
        branchId: req.branch!,
        amenityId: amenity.id,
        status: amenity.status ?? Status.ACTIVE,
        meta: amenity.meta ?? null,
      },
      { transaction: t }
    );
  }
    }

    await t.commit();

    return res.status(200).json({ profile, message: "Profile updated successfully!" });
  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({ message: "Sorry, something went wrong!" });
  }
};

export const fetchProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;    
    const selectedProfile = req.profile;

    if (!selectedProfile) {
      return res.status(400).json({ success: false, message: "No profile selected." });
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
        return res.status(400).json({ message: "Sorry select a profile!" });
        break;
    }

    const profile = await Profile.findOne({
      where: { id: selectedProfile.id, userId: user },
      include: includes,
    });

    // profile["recentVisits"] = [];

    res.status(200).json({ profile, message: "Profile fetched flushed!" });

  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Sorry something went wrong!" });
  }
};



