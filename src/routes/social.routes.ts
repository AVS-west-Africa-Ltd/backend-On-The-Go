import express from "express";
import * as SocialController from "../controllers/SocialController";
import { authProfile } from "../middlewares/authProfile";

const router = express.Router();

router.use(authProfile);

router.post("/follow/:userId", SocialController.followUser);
router.post("/unfollow/:userId", SocialController.unfollowUser);
router.get("/followers", SocialController.getFollowers);
router.get("/following", SocialController.getFollowing);
router.get("/suggestions/following", SocialController.getFollowSuggestions); // For chat suggestions
// Community routes often live in community.routes.ts, but can be mirrored or linked here if needed.

export default router;
