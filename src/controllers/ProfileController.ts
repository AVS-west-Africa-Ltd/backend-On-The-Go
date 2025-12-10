import { Request, Response } from "express";
import { ICreateProfileDTO } from "../dtos/profile.dto";
import { errorHandler } from "../handlers/responseHandlers";
import { ProfileService } from "../services/profile.service";
import { Branch } from "../models/Branch";

export const createProfile = async (req: Request, res: Response) => {
  try {
    const data = req.body as ICreateProfileDTO;
    const userId = req.user!;

    const { profile, token } = await ProfileService.createProfile(data, userId);

    return res
      .status(200)
      .json({ profile, token, message: "Profile created successfully!" });

  } catch (error: any) {
    console.error("Profile creation failed:", error);
    return res.status(400).json({ message: error.message || "Something went wrong!" });
  }
};

export const addMoreInfomation = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const userId = req.user;

    await ProfileService.addMoreInformation(req.body, userId, profileId);

    return res.status(200).json({ message: "Perfect more information added!" });

  } catch (error: any) {
    console.error("Add more info error:", error);
    if (error.message === "Profile not found!") {
      return errorHandler(res, error.message, 400);
    }
    res.status(400).json({ message: error.message || "Sorry adding more information failed!" });
  }
};

export const addInterestsAndPlaces = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const userId = req.user;

    const profile = await ProfileService.addInterestsAndPlaces(req.body, userId, profileId);

    return res.status(200).json({
      profile,
      message: "Wow profile updated successfully!"
    });

  } catch (error: any) {
    console.error("Interests update error:", error);
    return res.status(400).json({
      message: error.message || "Sorry interest & places update failed"
    });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { documentType } = req.body;
    const document = await ProfileService.uploadDocument(documentType, req.file, req.profile!.id);

    res.status(200).json({ document, message: "Document uploaded successfilly!" });

  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message || "Sorry something went wrong!" });
  }
};

export const addOpeningHours = async (req: Request, res: Response) => {
  try {
    const { hours } = req.body;
    const branchId = req.params.branchId;
    const profileId = req.profile!.id; // businessId

    const openingHours = await ProfileService.addOpeningHours(hours, branchId, profileId);

    return res.status(200).json({ openingHours, message: "Added opening hours successfilly!" });

  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message || "Sorry something went wrong!" });
  }
};

export const addAmenities = async (req: Request, res: Response) => {
  try {
    const { amenities } = req.body;
    const profileId = req.profile!.id;
    const branchId = req.branch!;
    const userId = req.user;

    await ProfileService.addAmenities(amenities, userId, profileId, branchId);

    return res.status(200).json({
      message: "Amenities added successfully!"
    });

  } catch (error: any) {
    console.log(error);
    return res.status(400).json({
      message: error.message || "Sorry adding amenities failed!"
    });
  }
};

export const addPhotos = async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.body;
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];
    const userId = req.user;

    const createdMedia = await ProfileService.addPhotos(targetType, targetId, files, userId);

    return res.status(201).json({
      createdMedia,
      message: `Successfully uploaded ${createdMedia.length} photo(s)`,
    });

  } catch (error: any) {
    console.error('Photo upload error:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed for uploaded files',
        errors: error.errors?.map((err: any) => err.message)
      });
    }
    return res.status(500).json({
      message: error.message || 'Sorry failed to upload photos',
    });
  }
};

export const addSocials = async (req: Request, res: Response) => {
  try {
    const { socials = {} } = req.body;
    const { profile, user: userId } = req;

    const createdSocials = await ProfileService.addSocials(socials, userId, profile!.id);

    return res.status(200).json({
      data: createdSocials,
      message: "Social media links updated successfully",
      count: createdSocials.length
    });

  } catch (error: any) {
    console.error("Error adding socials:", error);
    return res.status(500).json({
      message: error.message || "Failed to update social media links",
    });
  }
};

export const addWifiDetails = async (req: Request, res: Response) => {
  try {
    const amenity = await ProfileService.addWifiDetails(req.body, req.branch!, req.profile!.id);

    return res.status(200).json({
      amenity,
      message: "WiFi details added successfully!",
    });
  } catch (error: any) {
    console.error("addWifiDetails error:", error);
    return res.status(400).json({ message: error.message || "Sorry, something went wrong!" });
  }
};

export const addRedeemRewardHours = async (req: Request, res: Response) => {
  try {
    const { hours } = req.body;
    const { profile } = req;

    const rewardRedeemHours = await ProfileService.addRedeemRewardHours(hours, profile!.id);

    return res.status(200).json({
      data: rewardRedeemHours,
      message: "Reward redeem hours updated successfully",
    });

  } catch (error: any) {
    console.error("Error updating reward redeem hours:", error);
    return res.status(400).json({
      message: error.message || "Failed to update reward redeem hours",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const selectedProfile = req.profile;
    const branchId = req.branch!;

    const profile = await ProfileService.updateProfile(req.body, userId, selectedProfile, req.file, branchId);

    return res.status(200).json({ profile, message: "Profile updated successfully!" });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({ message: error.message || "Sorry, something went wrong!" });
  }
};

export const fetchProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const selectedProfile = req.profile;

    const profile = await ProfileService.fetchProfile(selectedProfile, user);

    res.status(200).json({ profile, message: "Profile fetched flushed!" });

  } catch (error: any) {
    console.log(error);
    res.status(400).json({ message: error.message || "Sorry something went wrong!" });
  }
};



