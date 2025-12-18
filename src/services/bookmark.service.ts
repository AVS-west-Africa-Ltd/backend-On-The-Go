import { Op } from "sequelize";
import { Bookmark } from "../models/Bookmark";
import { Post } from "../models/Post";
import { Profile } from "../models/Profile";
import { IBaseQueryDTO } from "../dtos/base.dto";

export class BookmarkService {
    static async toggleBookmark(profileId: number, postId: number) {
        const existingBookmark = await Bookmark.findOne({
            where: { profileId, postId },
        });

        if (existingBookmark) {
            await existingBookmark.destroy();
            return { bookmarked: false };
        }

        await Bookmark.create({ profileId, postId });
        return { bookmarked: true };
    }

    static async getUserBookmarks(profileId: number, query: IBaseQueryDTO) {
        const { limit = 10, cursor } = query;
        const whereClause: any = { profileId };

        if (cursor) {
            const [lastCreatedAt, lastId] = cursor.split("_");
            whereClause[Op.or] = [
                { createdAt: { [Op.lt]: lastCreatedAt } },
                {
                    createdAt: lastCreatedAt,
                    id: { [Op.lt]: lastId },
                },
            ];
        }

        const bookmarks = await Bookmark.findAll({
            where: whereClause,
            include: [
                {
                    model: Post,
                    as: "post",
                    include: [
                        {
                            model: Profile,
                            as: "author",
                            attributes: ["id", "userName", "picture", "firstName", "lastName"]
                        },
                        {
                            model: Profile,
                            as: "business",
                            attributes: ["id", "userName", "picture", "firstName", "lastName"]
                        }
                    ]
                },
                {
                    model: Profile,
                    as: "profile",
                    required: true,
                }
            ],
            limit: Number(limit) + 1,
            order: [["createdAt", "DESC"], ["id", "DESC"]],
        });

        let nextCursor = null;
        if (bookmarks.length > Number(limit)) {
            bookmarks.pop();
            const nextItem = bookmarks[bookmarks.length - 1];
            if (nextItem) {
                nextCursor = `${nextItem.createdAt.toISOString()}_${nextItem.id}`;
            }
        }

        return {
            bookmarks,
            nextCursor,
        };
    }
}
