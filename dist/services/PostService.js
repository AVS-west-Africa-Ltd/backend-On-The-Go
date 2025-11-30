const { Post, Business, User, Comment, UserFollower, BlockedUser } = require("../models");
const { Op, Sequelize } = require("sequelize");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage: storage });
class PostService {
    static async createPost(data) {
        try {
            const post = await Post.create(data);
            await Business.increment({ ratingsCount: data.rating, postsCount: 1 }, { where: { id: data.businessId } });
            return post;
        }
        catch (err) {
            throw err;
        }
    }
    static async createImage(data) {
        const uploadHandler = upload.array("media", 10);
        uploadHandler(req, res, async (err) => {
            if (err) {
                console.error("Error uploading files:", err);
                return res
                    .status(501)
                    .json({ message: "Error uploading files", error: err.message });
            }
            try {
                const newPost = await BusinessPost.create({
                    media: data,
                });
            }
            catch (error) {
                throw new Error("Error uploading images");
            }
        });
    }
    static async getPostById(postId) {
        try {
            return await Post.findByPk(postId);
        }
        catch (err) {
            throw new Error("Error fetching post");
        }
    }
    static async getPostsByUserId(userId, postType) {
        try {
            return await Post.findAll({
                where: {
                    [Op.and]: [{ userId: userId }, { postType: postType }],
                },
            });
        }
        catch (e) {
            throw e;
        }
    }
    static async getPosts(currentUserId) {
        try {
            const blockedUsers = await BlockedUser.findAll({
                where: {
                    user: currentUserId,
                }
            });
            const blockedIds = blockedUsers.map(b => b.blocked);
            const posts = await Post.findAll({
                where: {
                    userId: { [Op.notIn]: blockedIds }
                },
                include: [{
                        model: Comment,
                        as: "comments",
                        include: [{ model: Comment, as: "replies" }],
                    },
                    { model: Business, as: "business" },
                    { model: User, as: "user" },
                ],
                order: [["createdAt", "DESC"]],
                limit: 30
            });
            return posts.map((post) => {
                const raw = post.toJSON();
                const safeParse = (value, fallback = []) => {
                    try {
                        return JSON.parse(value || JSON.stringify(fallback));
                    }
                    catch (err) {
                        console.error("Failed to parse JSON:", value);
                        return fallback;
                    }
                };
                return {
                    ...raw,
                    likes: raw.likes,
                    media: raw.media,
                    bookmarks: raw.bookmarks,
                    business: raw.business
                        ? {
                            ...raw.business,
                            amenities: raw.business.amenities,
                            social: raw.business.social,
                            wifi: raw.business.wifi,
                            hours: raw.business.hours, // fallback is object
                        }
                        : null,
                };
            });
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }
    static async updatePost(postId, updates) {
        try {
            const post = await Post.findByPk(postId);
            if (!post)
                return false;
            return await post.update(updates);
        }
        catch (err) {
            throw new Error("Error updating post");
        }
    }
    static async deletePost(postId) {
        try {
            const post = await Post.findByPk(postId);
            if (!post)
                return false;
            return await post.destroy();
        }
        catch (err) {
            throw new Error("Error deleting post");
        }
    }
    static async toggleLike(postId, userId) {
        try {
            let post = await Post.findByPk(postId, {
                attributes: ["id", "likes"],
            });
            if (!post)
                return false;
            let likes = post.likes || [];
            if (typeof likes === "string") {
                likes = JSON.parse(likes);
            }
            if (!Array.isArray(likes)) {
                likes = [];
            }
            if (likes.includes(userId)) {
                likes = likes.filter((id) => id !== userId);
            }
            else {
                likes.push(userId);
            }
            post = await Post.update({ likes: likes }, { where: { id: postId } });
            return post;
        }
        catch (err) {
            console.error("Error updating post:", err);
            throw new Error("Error updating likes");
        }
    }
    static async ratePost(postId, newRating) {
        try {
            const post = await Post.findByPk(postId);
            if (!post)
                return false;
            const currentRating = post.rating || 0;
            const ratingsCount = post.ratingsCount || 0;
            const totalRating = currentRating * ratingsCount + newRating;
            const newRatingsCount = ratingsCount + 1;
            const averageRating = totalRating / newRatingsCount;
            await post.update({
                rating: averageRating,
                ratingsCount: newRatingsCount,
            });
            return post;
        }
        catch (err) {
            console.error("Error updating post:", err);
            throw new Error("Error updating post rating");
        }
    }
    static async toggleBookmark(postId, userId) {
        try {
            const post = await Post.findByPk(postId);
            if (!post)
                return false;
            let bookmarks = post.bookmarks || [];
            if (typeof bookmarks === "string") {
                bookmarks = bookmarks;
            }
            if (!Array.isArray(bookmarks)) {
                bookmarks = [];
            }
            if (bookmarks.includes(userId)) {
                bookmarks = bookmarks.filter((id) => id !== userId);
            }
            else {
                bookmarks.push(userId);
            }
            await post.update({ bookmarks });
            return post;
        }
        catch (err) {
            console.log(err);
            throw new Error("Error toggling bookmark");
        }
    }
    static async getBookmarkedPostsByUser(userId) {
        try {
            return await Post.findAll({
                where: Sequelize.literal(`JSON_CONTAINS(bookmarks, '"${userId}"')`),
                attributes: { exclude: ["bookmarks"] },
            });
        }
        catch (err) {
            console.error(err);
            throw new Error("Error fetching bookmarked posts");
        }
    }
    static async getPostStatistics(userId) {
        try {
            // Get total posts count
            const totalPosts = await Post.count({
                where: { userId }
            });
            // Get posts by rating categories
            const highRatingPosts = await Post.count({
                where: {
                    userId,
                    rating: { [Op.gte]: 4 } // 4 stars and above
                }
            });
            const mediumRatingPosts = await Post.count({
                where: {
                    userId,
                    rating: { [Op.between]: [2, 3.99] } // 2-3.99 stars
                }
            });
            const lowRatingPosts = await Post.count({
                where: {
                    userId,
                    rating: { [Op.lt]: 2 } // Below 2 stars
                }
            });
            return {
                totalPosts,
                highRatingPosts,
                mediumRatingPosts,
                lowRatingPosts
            };
        }
        catch (error) {
            throw error;
        }
    }
}
module.exports = PostService;
