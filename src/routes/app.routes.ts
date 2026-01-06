import express from "express";

const router = express.Router();
import { authProfile } from "../middlewares/authProfile";
import { fetchPosts, searchBusinesses, makeComment, toggleReaction, followProfile, createChat, fetchChats, createPost, joinCommunity, leaveCommunity, fetchCommunities } from "../controllers/AppController";
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

router.use(authProfile);

router.post("/create-post", upload.array("media", 5), validateBody(createPostSchema), createPost);
router.get("/fetch-posts", validateQuery(fetchPostsSchema), fetchPosts);
router.get("/fetch-businesses", validateQuery(searchBusinessesSchema), searchBusinesses);
router.post("/make-comment", validateBody(makeCommentSchema), makeComment);
router.post("/toggle-reaction", validateBody(toggleReactionSchema), toggleReaction);
router.post("/follow-profile", validateBody(followProfileSchema), followProfile);
router.post("/create-chat", validateBody(createChatSchema), createChat);
router.get("/fetch-chats", fetchChats); // No validation needed for simple get
router.post("/join-community", validateBody(joinCommunitySchema), joinCommunity);
router.post("/leave-community", validateBody(leaveCommunitySchema), leaveCommunity);
router.get("/fetch-communities", validateQuery(fetchCommunitiesSchema), fetchCommunities);


export default router;