const pool = require('../config/db');

const Profile = {
  create: async (userId, bio, profilePhotoUrl, locationEnabled) => {
    const [result] = await pool.query(
      'INSERT INTO profiles (user_id, bio, profile_photo_url, location_enabled) VALUES (?, ?, ?, ?)',
      [userId, bio, profilePhotoUrl, locationEnabled]
    );
    return result.insertId;
  },

  addUserInterests: async (userId, interestIds) => {
    const values = interestIds.map(id => [userId, id]);
    const query = 'INSERT INTO user_interests (user_id, interest_category_id) VALUES ?';
    await pool.query(query, [values]);
  },

  getProfileByUserId: async (userId) => {
    const [profile] = await pool.query(
      `SELECT p.id, p.bio, p.profile_photo_url, p.location_enabled, 
              GROUP_CONCAT(ic.name) AS interests
       FROM profiles p
       LEFT JOIN user_interests ui ON p.user_id = ui.user_id
       LEFT JOIN interest_categories ic ON ui.interest_category_id = ic.id
       WHERE p.user_id = ?
       GROUP BY p.id`,
      [userId]
    );
    return profile[0] || null;
  }
};

module.exports = Profile;
