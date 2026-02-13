import express from "express";
import { create, addMembers, fetchMembers, update, fetchCommunity, fetchCommunityById, deleteCommunity } from "../controllers/community.controller";
import { authProfile } from "../middlewares/authProfile";
import { upload } from "../middlewares/upload";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import { createCommunitySchema, addMembersSchema, fetchMembersSchema, updateCommunitySchema } from "../validators/community.validator";

const router = express.Router();

router.use(authProfile);


router.post("/create", upload.single("photo"), validateBody(createCommunitySchema), create);
router.post("/add-members", validateBody(addMembersSchema), addMembers);
router.get("/fetch-members", validateQuery(fetchMembersSchema), fetchMembers);
router.get("/", fetchCommunity);
router.get("/:communityId", fetchCommunityById);
router.patch("/:communityId", upload.single("photo"), validateBody(updateCommunitySchema), update);
router.delete("/:communityId", deleteCommunity);

export default router;