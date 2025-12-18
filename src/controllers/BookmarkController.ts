import { Request, Response } from "express";
import { BookmarkService } from "../services/bookmark.service";
import { successHandler, errorHandler } from "../handlers/responseHandlers";

export class BookmarkController {
    static async toggleBookmark(req: Request, res: Response) {
        try {
            const { postId } = req.body;
            const profileId = req.profile!.id;

            const result = await BookmarkService.toggleBookmark(profileId, postId);
            return successHandler(res, "Bookmark updated", 200, result);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to toggle bookmark", 500);
        }
    }

    static async getUserBookmarks(req: Request, res: Response) {
        try {
            const profileId = req.profile!.id;
            const query = req.query;

            const result = await BookmarkService.getUserBookmarks(profileId, query);
            return successHandler(res, "Bookmarks retrieved", 200, result);
        } catch (error: any) {
            return errorHandler(res, error.message || "Failed to get bookmarks", 500);
        }
    }
}
