import { Request, Response } from "express";
import { ICreateProfileDTO } from "../dtos/profile.dto";
import { errorHandler, successHandler } from "../handlers/responseHandlers";
import { ProfileService } from "../services/profile.service";

export const createProfile = async (req: Request, res: Response) => {
  try {
    const data = req.body as ICreateProfileDTO;
    const userId = req.user!;

    const { profile, token } = await ProfileService.createProfile(data, userId);

    return successHandler(res, "Profile created successfully!", 200, { profile, token });
  } catch (error: any) {
    console.error("Profile creation failed:", error);
    return errorHandler(res, error.message || "Something went wrong!", 400);
  }
};

export const addMoreInfomation = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const userId = req.user;

    await ProfileService.addMoreInformation(req.body, userId, profileId);

    return successHandler(res, "Perfect more information added!", 200);
  } catch (error: any) {
    console.error("Add more info error:", error);
    if (error.message === "Profile not found!") {
      return errorHandler(res, error.message, 400);
    }
    return errorHandler(res, error.message || "Sorry adding more information failed!", 400);
  }
};

export const addInterestsAndPlaces = async (req: Request, res: Response) => {
  try {
    const profileId = req.profile!.id;
    const userId = req.user;

    const profile = await ProfileService.addInterestsAndPlaces(req.body, userId, profileId);

    return successHandler(res, "Wow profile updated successfully!", 200, { profile });
  } catch (error: any) {
    console.error("Interests update error:", error);
    return errorHandler(res, error.message || "Sorry interest & places update failed", 400);
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { documentType } = req.body;
    const document = await ProfileService.uploadDocument(documentType, req.file, req.profile!.id);

    return successHandler(res, "Document uploaded successfilly!", 200, { document });
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Sorry something went wrong!", 400);
  }
};

export const addOpeningHours = async (req: Request, res: Response) => {
  try {
    const { hours } = req.body;
    const branchId = req.params.branchId;
    const profileId = req.profile!.id; // businessId

    const openingHours = await ProfileService.addOpeningHours(hours, branchId, profileId);

    return successHandler(res, "Added opening hours successfilly!", 200, { openingHours });
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Sorry something went wrong!", 400);
  }
};

export const addAmenities = async (req: Request, res: Response) => {
  try {
    const { amenities } = req.body;
    const profileId = req.profile!.id;
    const branchId = req.branch!;
    const userId = req.user;

    await ProfileService.addAmenities(amenities, userId, profileId, branchId);

    return successHandler(res, "Amenities added successfully!", 200);
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Sorry adding amenities failed!", 400);
  }
};

export const addPhotos = async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.body;
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];
    const userId = req.user;

    const createdMedia = await ProfileService.addPhotos(targetType, targetId, files, userId);

    return successHandler(res, `Successfully uploaded ${createdMedia.length} photo(s)`, 201, { createdMedia });
  } catch (error: any) {
    console.error('Photo upload error:', error);
    if (error.name === 'SequelizeValidationError') {
      return errorHandler(res, 'Validation failed for uploaded files', 400);
    }
    return errorHandler(res, error.message || 'Sorry failed to upload photos', 500);
  }
};

export const addSocials = async (req: Request, res: Response) => {
  try {
    const { socials = {} } = req.body;
    const { profile, user: userId } = req;

    const createdSocials = await ProfileService.addSocials(socials, userId, profile!.id);

    return successHandler(res, "Social media links updated successfully", 200, {
      data: createdSocials,
      count: createdSocials.length
    });
  } catch (error: any) {
    console.error("Error adding socials:", error);
    return errorHandler(res, error.message || "Failed to update social media links", 500);
  }
};

export const addWifiDetails = async (req: Request, res: Response) => {
  try {
    const amenity = await ProfileService.addWifiDetails(req.body, req.branch!, req.profile!.id);

    return successHandler(res, "WiFi details added successfully!", 200, { amenity });
  } catch (error: any) {
    console.error("addWifiDetails error:", error);
    return errorHandler(res, error.message || "Sorry, something went wrong!", 400);
  }
};

export const addRedeemRewardHours = async (req: Request, res: Response) => {
  try {
    const { hours } = req.body;
    const { profile } = req;

    const rewardRedeemHours = await ProfileService.addRedeemRewardHours(hours, profile!.id);

    return successHandler(res, "Reward redeem hours updated successfully", 200, { data: rewardRedeemHours });
  } catch (error: any) {
    console.error("Error updating reward redeem hours:", error);
    return errorHandler(res, error.message || "Failed to update reward redeem hours", 400);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user;
    const selectedProfile = req.profile;
    const branchId = req.branch!;

    const profile = await ProfileService.updateProfile(req.body, userId, selectedProfile, req.file, branchId);

    return successHandler(res, "Profile updated successfully!", 200, { profile });
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Sorry, something went wrong!", 400);
  }
};

export const fetchProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const selectedProfile = req.profile;

    const profile = await ProfileService.fetchProfile(selectedProfile, user);

    return successHandler(res, "Profile fetched flushed!", 200, { profile });
  } catch (error: any) {
    console.log(error);
    return errorHandler(res, error.message || "Sorry something went wrong!", 400);
  }
};



