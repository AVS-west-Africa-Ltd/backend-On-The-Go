const Profile = require('../models/Profile');

const profileController = {
  createProfile: async (req, res) => {
    const { bio, profilePhotoUrl, locationEnabled, interests } = req.body;
    const userId = req.userId; // Get userId from the token via middleware

    try {
      // Create the profile
      const profileId = await Profile.create(userId, bio, profilePhotoUrl, locationEnabled);

      // Add user interests if provided
      if (interests && interests.length > 0) {
        await Profile.addUserInterests(userId, interests);
      }

      res.status(201).json({
        message: 'Profile created successfully',
        profileId: profileId,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating profile' });
    }
  },

  getProfile: async (req, res) => {
    const userId = req.userId; // Get userId from the token via middleware

    try {
      const profile = await Profile.getProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.status(200).json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching profile' });
    }
  }
};

module.exports = profileController;
