import { create } from "domain";
import express from "express";
import { addMembers, fetchMembers } from "../controllers/CommunityController";
import { authProfile } from "../middlewares/authProfile";
import { upload } from "../middlewares/upload";

const router = express.Router();

router.use(authProfile);

router.post("/create", upload.single("photo"), create);
router.post("/add-members",  addMembers);
router.get("/fetch-members", fetchMembers);
export default router;