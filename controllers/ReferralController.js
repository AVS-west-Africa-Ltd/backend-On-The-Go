const ReferralModel = require("../models/Referral");
const UserModel = require("../models/User");
const { Op } = require("sequelize");

// Moved generateReferralCode outside the class as a standalone function
const generateReferralCode = async (userId) => {
    const chars = "ABCDEFGHIJKLMNLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    do {
        code = "";
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Check if code exists
        const exists = await UserModel.findOne({ where: { referralCode: code } });
        if (!exists) break;
    } while (true);

    await UserModel.update({ referralCode: code }, { where: { id: userId } });
    return code;
};

class ReferralController {
    // Get or create user's referral code
    static async getReferralInfo(req, res) {
        try {
            const { userId } = req.params;

            const user = await UserModel.findByPk(userId, {
                attributes: ['id', 'referralCode', 'username', 'successfulReferrals']
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Generate code if doesn't exist - now using the standalone function
            if (!user.referralCode) {
                user.referralCode = await generateReferralCode(userId);
                await user.save();
            }

            const referralCount = await ReferralModel.count({
                where: { referrerId: userId }
            });

            return res.status(200).json({
                success: true,
                data: {
                    referralCode: user.referralCode,
                    totalReferrals: referralCount,
                    successfulReferrals: user.successfulReferrals,
                    username: user.username
                }
            });
        } catch (error) {
            console.error("Error in getReferralInfo:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    // Track a new referral and complete it immediately
    static async trackReferral(req, res) {
        try {
            const { referralCode } = req.params;
            const { refereeId } = req.body;

            if (!refereeId || isNaN(refereeId)) {
                return res.status(400).json({
                    success: false,
                    message: "Valid refereeId is required"
                });
            }

            const referrer = await UserModel.findOne({
                where: { referralCode },
                attributes: ['id']
            });

            if (!referrer) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid referral code"
                });
            }

            const referee = await UserModel.findByPk(refereeId);
            if (!referee) {
                return res.status(404).json({
                    success: false,
                    message: "Referee user not found"
                });
            }

            if (referrer.id === referee.id) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot refer yourself"
                });
            }

            const existingReferral = await ReferralModel.findOne({
                where: { refereeId }
            });

            if (existingReferral) {
                return res.status(400).json({
                    success: false,
                    message: "This user has already been referred"
                });
            }

            const newReferral = await ReferralModel.create({
                referrerId: referrer.id,
                refereeId,
                status: 'completed'
            });

            await UserModel.increment('successfulReferrals', {
                where: { id: referrer.id }
            });

            return res.status(201).json({
                success: true,
                message: "Referral tracked and completed successfully",
                referrerId: referrer.id,
                refereeId,
                referralCode
            });
        } catch (error) {
            console.error("Error in trackReferral:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get referral history
    static async getReferralHistory(req, res) {
        try {
            const { userId } = req.params;

            // 1. Get all referrals for this user
            const referrals = await ReferralModel.findAll({
                where: { referrerId: userId },
                raw: true
            });

            if (!referrals || referrals.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }

            // 2. Get all referee details in one query
            const refereeIds = referrals.map(r => r.refereeId);
            const referees = await UserModel.findAll({
                where: { id: refereeIds },
                attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
                raw: true
            });

            // 3. Combine the data manually
            const referralsWithReferees = referrals.map(referral => {
                const referee = referees.find(r => r.id === referral.refereeId) || {};
                return {
                    ...referral,
                    Referee: referee
                };
            });

            return res.status(200).json({
                success: true,
                data: referralsWithReferees
            });

        } catch (error) {
            console.error("Error in getReferralHistory:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}

module.exports = ReferralController;