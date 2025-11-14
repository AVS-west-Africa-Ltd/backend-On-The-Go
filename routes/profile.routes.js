const express = require("express");
const router = express.Router();
const profileController = require("../controllers/ProfileController");
const authUser = require("../middlewares/authUser");
const authProfile = require("../middlewares/authProfile");
const Upload = require("../middlewares/upload");


router.get("/fetch", authUser, Upload.single("picture"), profileController.fetchProfile);

router.post("/create", authUser, Upload.single("picture"), profileController.createProfile);

router.post("/add-more-information", authProfile, profileController.addMoreInfomation);

router.post("/add-amenities", authProfile, profileController.addAmenities);

router.post('/add-photos', authProfile, Upload.array('photos', 5), profileController.addPhotos);

router.post("/update", authProfile, Upload.single("picture"), profileController.updateProfile);

router.post("/interests-places", authProfile, profileController.addInterestsAndPlaces);

router.post("/upload-document", authProfile, Upload.single("document"), profileController.uploadDocument);

router.post("/opening-hours", authProfile, profileController.addOpeningHours);

router.post("/socials", authProfile, profileController.addSocials);

router.post("/wifi", authProfile, profileController.addWifiDetails);

router.post("/reward-redeem-hours", authProfile, profileController.addRedeemRewardHours);

module.exports = router;
