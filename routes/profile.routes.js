const express = require("express");
const router = express.Router();
const profileController = require("../controllers/ProfileController");
const authMiddleware = require("../middleware/auth"); 


router.use(authMiddleware);


router.post("/create", profileController.createProfile);
router.post("/interests-places", profileController.addInterestsAndPlaces);


router.post("/upload-document", profileController.uploadDocument);


router.post("/opening-hours", profileController.addOpeningHours);


router.post("/socials", profileController.addSocials);


router.post("/wifi", profileController.addWifiDetails);


router.post("/reward-redeem-hours", profileController.addRedeemRewardHours);

module.exports = router;
