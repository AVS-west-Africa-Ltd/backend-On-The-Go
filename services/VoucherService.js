// services/VoucherService.js
const VoucherTemplate = require("../models/VoucherTemplate");
const UserVoucher = require("../models/UserVoucher");
const Business = require("../models/Business");
const Post = require("../models/Post"); // Add this import
const { generateUniqueCode } = require("../utils/voucherUtils");

class VoucherService {
  static async createAutomaticVoucher(businessId, userId) {
    try {
      // Find the business to get the owner
      const business = await Business.findByPk(businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Get the user's total number of reviews
      const reviewCount = await Post.count({
        where: {
          userId: userId,
          postType: 'business' // Assuming business posts are reviews
        }
      });

      // Determine discount based on loyalty level
      let discountPercent;
      if (reviewCount >= 101) {
        discountPercent = 15; // Gold level
      } else if (reviewCount >= 51) {
        discountPercent = 10; // Silver level
      } else {
        discountPercent = 5; // Bronze level
      }

      // Create voucher template
      const voucherTemplate = await VoucherTemplate.create({
        name: `Loyalty Reward (${discountPercent}% off)`,
        businessId: businessId,
        businessName: business.name,
        discountPercent: discountPercent,
        validDays: JSON.stringify([]),
        businessImage: business.logo || "default.jpg",
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        specialCode: generateUniqueCode(),
        maxClaims: 1
      });

      // Create user voucher
      const userVoucher = await UserVoucher.create({
        templateId: voucherTemplate.id,
        userId: userId,
        uniqueCode: generateUniqueCode()
      });

      return {
        voucherId: voucherTemplate.id,
        voucherCode: userVoucher.uniqueCode,
        discountPercent: discountPercent
      };
    } catch (error) {
      console.error('Error in createAutomaticVoucher:', error);
      throw error;
    }
  }

  // Add other voucher service methods here...
}

module.exports = VoucherService;