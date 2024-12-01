const PostService = require('../services/PostService');
const ImageService = require('../services/ImageService');

class PostController {
    static async createPost(req, res) {
        try {
            const { userId, businessId, description, rating } = req.body;
            // const files = req.files;

            if(!description || !rating || !businessId || !userId) return res.status(400).json({ message: 'All fields are required' });

            // if (!files || files.length === 0) return res.status(400).json({ message: 'At least one image is required' });

            let payload = { userId, description, rating, businessId };
            const post = await PostService.createPost(payload);

            // const imagePayloads = files.map(file => ({ postId: post.id, fileName: file.filename, filePath: file.path, }));
            // await ImageService.createImage(imagePayloads);

            return res.status(201).json({ message: 'Post successfully created' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async getPostById(req, res) {
        try {
            const { postId } = req.params;

            const post = await PostService.getPostById(postId);

            if (!post) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({
                info: post
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getPosts(req, res) {
        try {
            const posts = await PostService.getPosts();
            if (!posts || posts.length === 0) return res.status(404).json({ message: 'Posts not found', info: [] });
            return res.status(200).json({ info: posts });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async updatePost(req, res) {
        try {
            const { postId } = req.params;

            const post = await PostService.updatePost(postId, req.body);
            if (!post) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({ message: 'Post successfully updated' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    static async deletePost(req, res) {
        try {
            const { postId } = req.params;

            const post = await PostService.deletePost(postId);

            if (!post) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({ message: 'Post deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async toggleLike(req, res) {
        try {
            const { postId, userId } = req.params;

            const post = await PostService.toggleLike(postId, userId);
            if (!post) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({ message: 'Post toggled successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message, message: error });
        }
    }

    static async ratePost(req, res) {
        try {
            const { postId } = req.params;

            const post = await PostService.ratePost(postId, req.body.rating);
            if(!post) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({ message: 'Post rated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async bookmarkPost(req, res) {
        try {
            const { userId, postId } = req.params;

            const post = await PostService.toggleBookmark(postId, userId);
            if (!post) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({ message: 'Bookmark toggled successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getBookmarkedPosts(req, res) {
        try {
            const { userId } = req.params;

            const posts = await PostService.getBookmarkedPostsByUser(userId);
            if (!posts) return res.status(404).json({ message: 'Post not found' });
            return res.status(200).json({ info: posts });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }
}

module.exports = PostController;
