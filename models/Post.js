const pool = require('../config/db');

const Post = {
  // Create a post with the associated data (location, details, rating, etc.)
  createPost: async (userId, locationName, locationAddress, details, overallRating, status) => {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, location_name, location_address, details, overall_rating, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, locationName, locationAddress, details, overallRating, status]
    );
    return result.insertId;
  },

  // Insert media associated with a post
  addPostMedia: async (postId, mediaType, mediaUrl, mediaThumbnailUrl) => {
    const [result] = await pool.query(
      'INSERT INTO post_media (post_id, media_type, media_url, media_thumbnail_url) VALUES (?, ?, ?, ?)',
      [postId, mediaType, mediaUrl, mediaThumbnailUrl]
    );
    return result.insertId;
  },

  // Insert amenity rating for a post
  addAmenityRating: async (postId, amenityId, rating) => {
    const [result] = await pool.query(
      'INSERT INTO post_amenity_ratings (post_id, amenity_id, rating) VALUES (?, ?, ?)',
      [postId, amenityId, rating]
    );
    return result.insertId;
  },

  // Get all posts with amenities and media
  getAllPosts: async (limit = 10) => {
    const [posts] = await pool.query(
      'SELECT * FROM posts ORDER BY created_at DESC LIMIT ?',
      [limit]
    );

    // For each post, fetch associated media and amenities
    for (let post of posts) {
      post.media = await this.getPostMedia(post.id);
      post.amenities = await this.getPostAmenityRatings(post.id);
    }

    return posts;
  },

  // Get post details by post ID with associated media and amenities
  getPostById: async (postId) => {
    const [post] = await pool.query(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );

    if (!post[0]) return null;

    const postDetails = post[0];
    postDetails.media = await this.getPostMedia(postId);
    postDetails.amenities = await this.getPostAmenityRatings(postId);

    return postDetails;
  },

  // Get media associated with a post
  getPostMedia: async (postId) => {
    const [media] = await pool.query(
      'SELECT * FROM post_media WHERE post_id = ?',
      [postId]
    );
    return media;
  },

  // Get ratings for amenities associated with a post
  getPostAmenityRatings: async (postId) => {
    const [ratings] = await pool.query(
      'SELECT a.name, r.rating FROM post_amenity_ratings r JOIN amenities a ON r.amenity_id = a.id WHERE r.post_id = ?',
      [postId]
    );
    return ratings;
  },

  // Update a post's information (location, details, rating, etc.)
  updatePost: async (postId, updates) => {
    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    values.push(postId);

    const query = `UPDATE posts SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  // Delete a post from the database
  deletePost: async (postId) => {
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
    return result.affectedRows > 0;
  }
};

module.exports = Post;
