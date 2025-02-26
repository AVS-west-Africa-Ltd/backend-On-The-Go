const ProfileView = require("../models/ProfileView");
const User = require("../models/User");



class ProfileViewService {
    // Log a profile view or update the existing one
    static async logProfileView(viewerId, profileOwnerId) {
        try {
            if (viewerId === profileOwnerId) return; // Prevent self-view logging

            let profileView = await ProfileView.findOne({
                where: { viewerId, profileOwnerId },
            });

            if (profileView) {
                // Update click count and timestamp
                profileView.clickCount += 1;
                profileView.viewedAt = new Date();
                await profileView.save();
            } else {
                // Create a new profile view entry
                await ProfileView.create({ viewerId, profileOwnerId });
            }
        } catch (error) {
            console.error("Error logging profile view:", error);
        }
    }

    // Get total views for a profile
    static async getProfileViewCount(profileOwnerId) {
        try {
            return await ProfileView.count({ where: { profileOwnerId } });
        } catch (error) {
            console.error("Error fetching profile views:", error);
            return 0;
        }
    }

    // Get list of viewers
    static async getProfileViewers(profileOwnerId) {
        try {
            return await ProfileView.findAll({
                where: { profileOwnerId },
                include: [{ model: User, as: "Viewer", attributes: ["id", "firstName", "lastName", "username", "email", "picture", "gender", "location", "interests", "skills", "profession" ] }],
                order: [["viewedAt", "DESC"]],
            });
        } catch (error) {
            console.error("Error fetching profile viewers:", error);
            return [];
        }
    }
}

module.exports = ProfileViewService;
