import express from "express";
import { BookmarkController } from "../controllers/bookmark.controller";
import { authProfile } from "../middlewares/authProfile";
import { validateBody, validateQuery } from "../middlewares/validateMiddleware";
import { toggleBookmarkSchema, getBookmarksSchema } from "../validators/bookmark.validator";

const router = express.Router();

router.use(authProfile);

router.post("/", validateBody(toggleBookmarkSchema), BookmarkController.toggleBookmark);
router.get("/", validateQuery(getBookmarksSchema), BookmarkController.getUserBookmarks);

export default router;
