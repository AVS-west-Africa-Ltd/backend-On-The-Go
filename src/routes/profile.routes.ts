import express from "express";
import { upload } from "../middlewares/upload";
import { authProfile } from "../middlewares/authProfile";
import { authUser } from "../middlewares/authUser";
import { createProfile, addMoreInfomation, addAmenities, addPhotos, updateProfile, addInterestsAndPlaces, uploadDocument, addOpeningHours, addSocials, addWifiDetails, addRedeemRewardHours, fetchProfile } from "../controllers/ProfileController";

const router = express.Router();

router.get("/fetch", authProfile, upload.single("picture"), fetchProfile);

router.post("/create", authUser, upload.single("picture"), createProfile);

router.post("/add-more-information", authProfile, addMoreInfomation);

router.post("/add-amenities", authProfile, addAmenities);

router.post('/add-photos', authProfile, upload.array('photos', 5), addPhotos);

router.post("/update", authProfile, upload.single("picture"), updateProfile);

router.post("/interests-places", authProfile, addInterestsAndPlaces);

router.post("/upload-document", authProfile, upload.single("document"), uploadDocument);

router.post("/opening-hours", authProfile, addOpeningHours);

router.post("/socials", authProfile, addSocials);

router.post("/wifi", authProfile, addWifiDetails);

router.post("/reward-redeem-hours", authProfile, addRedeemRewardHours);

export default router;
