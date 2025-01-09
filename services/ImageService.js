const Image = require('../models/Image'); // Assuming the Image model is defined in models/Image.js

class ImageService {
    /**
     * Create a new image entry in the database.
     * @param {Object} imageData - The image details to store.
     * @returns {Promise<Object>} - The created image.
     */
    static async createImage(imageData) {
        try {
            return await Image.create(imageData);
        } catch (err) {
            throw new Error('Error creating image: ' + err.message);
        }
    }

    /**
     * Get all images associated with a post.
     * @param {number} postId - The ID of the post.
     * @returns {Promise<Array>} - List of images associated with the post.
     */
    static async getImagesByPostId(postId) {
        try {
            return await Image.findAll({ where: { postId } });
        } catch (err) {
            throw new Error('Error fetching images for the post: ' + err.message);
        }
    }

    /**
     * Delete an image entry from the database.
     * @param {number} imageId - The ID of the image.
     * @returns {Promise<number>} - The number of rows deleted.
     */
    static async deleteImage(imageId) {
        try {
            return await Image.destroy({ where: { id: imageId } });
        } catch (err) {
            throw new Error('Error deleting image: ' + err.message);
        }
    }

    /**
     * Delete all images associated with a post.
     * @param {number} postId - The ID of the post.
     * @returns {Promise<number>} - The number of rows deleted.
     */
    static async deleteImagesByPostId(postId) {
        try {
            return await Image.destroy({ where: { postId } });
        } catch (err) {
            throw new Error('Error deleting images for the post: ' + err.message);
        }
    }
}

module.exports = ImageService;
