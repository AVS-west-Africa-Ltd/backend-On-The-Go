import express from "express";

const router = express.Router();
import { authProfile } from "../middlewares/authProfile";
import { fetchPosts, searchBusinesses, makeComment, toggleReaction, followProfile, createChat, fetchChats, createPost, getBranchForUser } from "../controllers/AppController";
import { upload } from "../middlewares/upload";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import {
    createPostSchema,
    fetchPostsSchema,
    searchBusinessesSchema,
    makeCommentSchema,
    toggleReactionSchema,
    followProfileSchema,
    createChatSchema,
    joinCommunitySchema,
    leaveCommunitySchema,
    fetchCommunitiesSchema
} from "../validators/app.validator";

import { validateBody } from "../middlewares/validateMiddleware";
import { createPostSchema } from "../validators/post.validator";

router.use(authProfile);

router.post("/create-post", validateBody(createPostSchema), upload.array("media", 5), createPost);
router.get("/fetch-posts", fetchPosts);
router.get("/fetch-businesses", searchBusinesses);
router.post("/make-comment", makeComment);
router.post("/toggle-reaction", toggleReaction);
router.post("/follow-profile", followProfile);
router.post("/create-chat", createChat);
router.get("/fetch-chats", fetchChats);
router.get("/:branchId/branch", getBranchForUser);


export default router;