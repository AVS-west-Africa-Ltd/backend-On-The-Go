const Post = require('../models/Post');
const {Op, Sequelize} = require("sequelize");

class PostService {
    static async createPost(data) {
        try {
            return await Post.create(data);
        }
        catch(err) {
            throw new Error('Error creating post');
        }
    }

    static async getPostById(postId) {
        try {
            return await Post.findByPk(postId);
        }
        catch(err) {
            throw new Error('Error fetching post');
        }
    }

    static async getPosts() {
        try {
            return await Post.findAll({});
        }
        catch (error) {
            throw new Error('Error fetching posts');
        }
    }

    static async updatePost(postId, updates) {
        try {
            const post = await Post.findByPk(postId);
            if (!post) return false;
            return await post.update(updates);
        }
        catch(err) {
            throw new Error('Error updating post');
        }
    }

    static async deletePost(postId) {
        try {
            const post = await Post.findByPk(postId);
            if (!post) return false;
            return await post.destroy();
        }
        catch(err) {
            throw new Error('Error deleting post');
        }
    }

    static async toggleLike(postId, userId) {
        try {
            const post = await Post.findByPk(postId);
            if (!post) return false;

            let likes = post.likes || [];
            if (typeof likes === 'string') {
                likes = JSON.parse(likes);
            }
            if (!Array.isArray(likes)) {
                likes = [];
            }

            if (likes.includes(userId)) {
                likes = likes.filter(id => id !== userId);
            } else {
                likes.push(userId);
            }

            await post.update({ likes });
            return post;
        } catch (err) {
            console.error('Error updating post:', err);
            throw new Error('Error updating likes');
        }
    }

    static async ratePost(postId, newRating) {
        try {
            const post = await Post.findByPk(postId);
            if (!post) return false;

            const currentRating = post.rating || 0;
            const ratingsCount = post.ratingsCount || 0;

            const totalRating = currentRating * ratingsCount + newRating;
            const newRatingsCount = ratingsCount + 1;
            const averageRating = totalRating / newRatingsCount;

            await post.update({
                rating: averageRating,
                ratingsCount: newRatingsCount
            });

            return post;
        } catch (err) {
            console.error('Error updating post:', err);
            throw new Error('Error updating post rating');
        }
    }

    static async toggleBookmark(postId, userId) {
        try {

            const post = await Post.findByPk(postId);
            if (!post) return false;

            let bookmarks = post.bookmarks || [];
            if (typeof bookmarks === 'string') {
                bookmarks = JSON.parse(bookmarks);
            }
            if (!Array.isArray(bookmarks)) {
                bookmarks = [];
            }

            if (bookmarks.includes(userId)) {
                bookmarks = bookmarks.filter(id => id !== userId);
            } else {
                bookmarks.push(userId);
            }

            await post.update({ bookmarks });
            return post;
        } catch (err) {
            console.log(err)
            throw new Error('Error toggling bookmark');
        }
    }

    static async getBookmarkedPostsByUser(userId) {
        try {
            return await Post.findAll({
                where: Sequelize.literal(`JSON_CONTAINS(bookmarks, '"${userId}"')`),
                attributes: { exclude: ['bookmarks'] },
            });
        } catch (err) {
            console.error(err);
            throw new Error('Error fetching bookmarked posts');
        }
    }
}

module.exports = PostService;
