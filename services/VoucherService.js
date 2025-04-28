// services/VoucherService.js
const VoucherTemplate = require("../models/VoucherTemplate");
const UserVoucher = require("../models/UserVoucher");
const Business = require("../models/Business");
const { generateUniqueCode } = require("../utils/voucherUtils");

class VoucherService {
  static async createAutomaticVoucher(businessId, userId) {
    try {
      // Find the business to get the owner
      const business = await Business.findByPk(businessId);
      if (!business) {
        throw new Error('Business not found');
      }

      // Create voucher template
      const voucherTemplate = await VoucherTemplate.create({
        name: "Thanks for your post!",
        businessId: businessId,
        businessName: business.name,
        discountPercent: 10,
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
        voucherCode: userVoucher.uniqueCode
      };
    } catch (error) {
      console.error('Error in createAutomaticVoucher:', error);
      throw error;
    }
  }

  // Add other voucher service methods here...
}

module.exports = VoucherService;