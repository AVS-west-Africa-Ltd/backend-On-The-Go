import express from "express";
import { authProfile } from "../middlewares/authProfile";
import {
    fetchPosts,
    searchBusinesses,
    makeComment,
    toggleReaction,
    followProfile,
    createChat,
    fetchChats,
    createPost,
    getBranchForUser,
    joinCommunity,
    leaveCommunity,
    fetchCommunities
} from "../controllers/app.controller";
import { upload } from "../middlewares/upload";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import {
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
import { createPostSchema } from "../validators/post.validator";
import { BookmarkController } from "../controllers/bookmark.controller";
import { toggleBookmarkSchema, getBookmarksSchema } from "../validators/bookmark.validator";
import * as ProductController from "../controllers/product.controller";
import { filterBranchProductsSchema } from "../validators/product.validator";


const router = express.Router();

router.use(authProfile);

router.post("/create-post", validateBody(createPostSchema), upload.array("media", 5), createPost);
router.get("/fetch-posts", validateQuery(fetchPostsSchema), fetchPosts);
router.get("/fetch-businesses", validateQuery(searchBusinessesSchema), searchBusinesses);
router.post("/make-comment", validateBody(makeCommentSchema), makeComment);
router.post("/toggle-reaction", validateBody(toggleReactionSchema), toggleReaction);
router.post("/follow-profile", validateBody(followProfileSchema), followProfile);
router.post("/create-chat", validateBody(createChatSchema), createChat);
router.get("/fetch-chats", fetchChats);
router.get("/:branchId/branch", getBranchForUser);

router.get("/branch/filter", validateQuery(filterBranchProductsSchema), ProductController.filterBranchProducts);

// Community interaction routes
router.post("/join-community", validateBody(joinCommunitySchema), joinCommunity);
router.post("/leave-community", validateBody(leaveCommunitySchema), leaveCommunity);
router.get("/fetch-communities", validateQuery(fetchCommunitiesSchema), fetchCommunities);

// Bookmarks routes

router.post("/bookmarks", validateBody(toggleBookmarkSchema), BookmarkController.toggleBookmark);
router.get("/bookmarks", validateQuery(getBookmarksSchema), BookmarkController.getUserBookmarks);

export default router;