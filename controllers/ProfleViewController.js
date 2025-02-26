const ProfileViewService = require("../services/ProfileViewService");

class ProfileViewController {
    // Track profile views when a profile is accessed
    static async viewProfile(req, res) {
        try {
            const { profileOwnerId, viewerId } = req.params; // Get user whose profile is viewed


            await ProfileViewService.logProfileView(viewerId, profileOwnerId);

            return res.status(200).json({ message: "Profile view logged" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Get profile views count
    static async getProfileViews(req, res) {
        try {
            const { profileOwnerId } = req.params;
            const count = await ProfileViewService.getProfileViewCount(profileOwnerId);

            return res.status(200).json({ views: count });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Get profile viewers list
    static async getProfileViewers(req, res) {
        try {
            const { profileOwnerId } = req.params;
            const viewers = await ProfileViewService.getProfileViewers(profileOwnerId);

            return res.status(200).json({ viewers });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = ProfileViewController;
