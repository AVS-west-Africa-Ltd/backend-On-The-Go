// controllers/VoucherController.js
const VoucherTemplate = require("../models/VoucherTemplate");
const UserVoucher = require("../models/UserVoucher");
const User = require("../models/User");
const Business = require("../models/Business");
const VoucherExchangeRequest = require("../models/VoucherExchangeRequest");
const {
  generateUniqueCode,
  validateVoucherDays,
  validateVoucherExpiry
} = require("../utils/voucherUtils");
const sequelize = require("../config/database");
const socketEvents = require("../services/voucherSocketEvents");

class VoucherController {
  /**
   * Create a new voucher template (for business owners)
   * POST /api/vouchers
   */
  static async createVoucher(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const {
        name,
        businessId,
        discountPercent,
        validDays,
        expiryDate,
        maxClaims
      } = req.body;

      // Validate required fields
      if (!name || !businessId || !discountPercent || !expiryDate) {
        return res.status(400).json({
          message: "Missing required fields: name, businessId, discountPercent, expiryDate"
        });
      }

      // Validate valid days if provided
      if (validDays) {
        const daysValidation = validateVoucherDays(validDays);
        if (!daysValidation.isValid) {
          return res.status(400).json({ message: daysValidation.message });
        }
      }

      // Validate expiry date
      const expiryValidation = validateVoucherExpiry(expiryDate);
      if (!expiryValidation.isValid) {
        return res.status(400).json({ message: expiryValidation.message });
      }

      // Verify business exists and is owned by requester
      const business = await Business.findByPk(businessId);
      if (!business) {
        return res.status(404).json({
          message: "Business not found",
          details: `No business found with ID: ${businessId}`
        });
      }

      if (business.userId !== req.userId) {
        return res.status(403).json({
          message: "You don't own this business"
        });
      }

      // Create voucher template
      const voucherTemplate = await VoucherTemplate.create({
        name,
        businessId,
        businessName: business.name,
        discountPercent,
        validDays: validDays ? JSON.stringify(validDays) : JSON.stringify([]),
        businessImage: business.logo || "default.jpg",
        expiryDate,
        specialCode: generateUniqueCode(),
        maxClaims: maxClaims || null
      });

      // Emit socket event
      const io = req.app.get('io');
      socketEvents.emitVoucherCreated(io, req.userId, {
        id: voucherTemplate.id,
        name: voucherTemplate.name,
        businessId: voucherTemplate.businessId,
        discountPercent: voucherTemplate.discountPercent,
        expiryDate: voucherTemplate.expiryDate,
        maxClaims: voucherTemplate.maxClaims,
        businessOwnerId: business.userId
      });

      return res.status(201).json({
        message: "Voucher created successfully",
        voucher: {
          id: voucherTemplate.id,
          name: voucherTemplate.name,
          businessId: voucherTemplate.businessId,
          discountPercent: voucherTemplate.discountPercent,
          expiryDate: voucherTemplate.expiryDate,
          maxClaims: voucherTemplate.maxClaims
        }
      });
    } catch (error) {
      console.error("Voucher creation error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }

  /**
   * Claim a voucher (for users)
   * POST /api/vouchers/:voucherId/claim
   */
  static async claimVoucher(req, res) {
    const transaction = await sequelize.transaction();
    try {
      if (!req.userId) {
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const { voucherId } = req.params;
      const userId = req.userId;

      // Find voucher template
      const voucherTemplate = await VoucherTemplate.findByPk(voucherId, { transaction });
      if (!voucherTemplate) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Voucher not found"
        });
      }

      // Check if voucher is active and not expired
      if (!voucherTemplate.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          message: "This voucher is no longer available"
        });
      }

      if (new Date(voucherTemplate.expiryDate) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Voucher has expired"
        });
      }

      // Check if user already claimed this voucher
      const existingClaim = await UserVoucher.findOne({
        where: {
          templateId: voucherId,
          userId
        },
        transaction
      });

      if (existingClaim) {
        await transaction.rollback();
        return res.status(400).json({
          message: "You've already claimed this voucher"
        });
      }

      // Check if max claims reached
      if (voucherTemplate.maxClaims) {
        const claimCount = await UserVoucher.count({
          where: { templateId: voucherId },
          transaction
        });

        if (claimCount >= voucherTemplate.maxClaims) {
          await transaction.rollback();
          return res.status(400).json({
            message: "This voucher has reached its maximum claims"
          });
        }
      }

      // Create user voucher
      const userVoucher = await UserVoucher.create({
        templateId: voucherId,
        userId,
        uniqueCode: generateUniqueCode()
      }, { transaction });

      // Get business owner ID for socket notification
      const business = await Business.findByPk(voucherTemplate.businessId, { transaction });
      const businessOwnerId = business ? business.userId : null;

      // Emit socket event
      const io = req.app.get('io');
      socketEvents.emitVoucherClaimed(io, userId, {
        id: userVoucher.id,
        templateId: voucherTemplate.id,
        name: voucherTemplate.name,
        businessName: voucherTemplate.businessName,
        discountPercent: voucherTemplate.discountPercent,
        expiryDate: voucherTemplate.expiryDate,
        validDays: voucherTemplate.validDays,
        uniqueCode: userVoucher.uniqueCode,
        isUsed: userVoucher.isUsed,
        businessOwnerId
      });

      await transaction.commit();

      return res.status(200).json({
        message: "Voucher claimed successfully",
        voucher: {
          id: userVoucher.id,
          templateId: voucherTemplate.id,
          name: voucherTemplate.name,
          businessName: voucherTemplate.businessName,
          discountPercent: voucherTemplate.discountPercent,
          expiryDate: voucherTemplate.expiryDate,
          validDays: voucherTemplate.validDays,
          uniqueCode: userVoucher.uniqueCode,
          isUsed: userVoucher.isUsed
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Voucher claim error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }

  /**
   * Use a voucher (mark as used)
   * POST /api/vouchers/use/:userVoucherId
   */
  static async useVoucher(req, res) {
    const transaction = await sequelize.transaction();
    try {
      console.log(`[Voucher Use] Starting process for userVoucherId: ${req.params.userVoucherId}, userId: ${req.userId}`);

      if (!req.userId) {
        console.log('[Voucher Use] Error: Authentication required');
        await transaction.rollback();
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const { userVoucherId } = req.params;

      console.log(`[Voucher Use] Looking up user voucher ${userVoucherId}`);

      // Find the user voucher
      const userVoucher = await UserVoucher.findByPk(userVoucherId, { transaction });

      if (!userVoucher) {
        console.log(`[Voucher Use] Error: User voucher not found with ID: ${userVoucherId}`);
        await transaction.rollback();
        return res.status(404).json({
          message: "Voucher not found",
          details: `No user voucher found with ID: ${userVoucherId}`
        });
      }

      // Manually find the related voucher template
      const voucherTemplate = await VoucherTemplate.findByPk(userVoucher.templateId, { transaction });

      if (!voucherTemplate) {
        console.log(`[Voucher Use] Error: Voucher template not found for ID: ${userVoucher.templateId}`);
        await transaction.rollback();
        return res.status(404).json({
          message: "Voucher template not found",
          details: `No voucher template found with ID: ${userVoucher.templateId}`
        });
      }

      console.log(`[Voucher Use] Found voucher: ${voucherTemplate.name} (Template ID: ${userVoucher.templateId})`);

      // Find the business that created this voucher
      const business = await Business.findByPk(voucherTemplate.businessId, { transaction });
      if (!business) {
        console.log(`[Voucher Use] Error: Business not found for voucher template`);
        await transaction.rollback();
        return res.status(404).json({
          message: "Business not found",
          details: "The business that created this voucher no longer exists"
        });
      }

      // Authorization check - only the business owner can mark vouchers as used
      if (business.userId !== req.userId) {
        console.log(`[Voucher Use] Error: User ${req.userId} is not the owner of business ${business.id}`);
        await transaction.rollback();
        return res.status(403).json({
          message: "Only the business that issued this voucher can mark it as used",
          details: `Business owned by user ${business.userId}, but requested by ${req.userId}`
        });
      }

      // State checks
      if (userVoucher.isUsed) {
        console.log(`[Voucher Use] Error: Voucher ${userVoucherId} already used at ${userVoucher.usedAt}`);
        await transaction.rollback();
        return res.status(400).json({
          message: "Voucher has already been used",
          details: `Voucher was used on: ${userVoucher.usedAt}`
        });
      }

      const currentDate = new Date();

      if (new Date(voucherTemplate.expiryDate) < currentDate) {
        console.log(`[Voucher Use] Error: Voucher expired on ${voucherTemplate.expiryDate}, current date is ${currentDate}`);
        await transaction.rollback();
        return res.status(400).json({
          message: "Voucher has expired",
          details: `Expired on: ${voucherTemplate.expiryDate}`
        });
      }

      // Check valid days if specified
      if (voucherTemplate.validDays) {
        let validDays;
        try {
          // Handle different formats of validDays
          if (typeof voucherTemplate.validDays === 'string') {
            validDays = JSON.parse(voucherTemplate.validDays);
          } else if (Array.isArray(voucherTemplate.validDays)) {
            validDays = voucherTemplate.validDays;
          } else {
            validDays = [];
          }

          // Ensure we have an array before proceeding
          if (!Array.isArray(validDays)) {
            validDays = [];
          }

          if (validDays.length > 0) {
            const today = new Date().toLocaleString('en-US', { weekday: 'long' });
            if (!validDays.includes(today)) {
              console.log(`[Voucher Use] Error: Voucher only valid on ${validDays.join(', ')}, today is ${today}`);
              await transaction.rollback();
              return res.status(400).json({
                message: `This voucher is only valid on: ${validDays.join(', ')}`,
                details: `Today is ${today}`
              });
            }
          }
        } catch (error) {
          console.error(`[Voucher Use] Error parsing validDays: ${error.message}`);
          // If there's an error parsing, treat as no day restrictions
        }
      }

      // Mark as used
      console.log(`[Voucher Use] Marking voucher ${userVoucherId} as used`);
      await userVoucher.update({
        isUsed: true,
        usedAt: currentDate
      }, { transaction });

      // Emit socket event
      try {
        const io = req.app.get('io');
        console.log('[Voucher Use] Attempting to emit socket events');
        console.log(`[Voucher Use] Emitting to user ${userVoucher.userId}`);
        
        socketEvents.emitVoucherUsed(io, userVoucher.userId, {
            id: userVoucher.id,
            templateId: voucherTemplate.id,
            name: voucherTemplate.name,
            businessName: voucherTemplate.businessName,
            discountPercent: voucherTemplate.discountPercent,
            isUsed: true,
            usedAt: currentDate.toISOString(),
            businessOwnerId: business.userId
        });

        console.log('[Voucher Use] Socket events emitted successfully');
    } catch (socketError) {
        console.error('[Voucher Use] Error emitting socket events:', socketError);
    }

      await transaction.commit();
      console.log(`[Voucher Use] Successfully marked voucher ${userVoucherId} as used`);

      return res.status(200).json({
        message: "Voucher used successfully",
        voucher: {
          id: userVoucher.id,
          templateId: voucherTemplate.id,
          name: voucherTemplate.name,
          businessName: voucherTemplate.businessName,
          discountPercent: voucherTemplate.discountPercent,
          isUsed: true,
          usedAt: currentDate.toISOString()
        }
      });

    } catch (error) {
      console.error(`[Voucher Use] System Error: ${error.message}`, error.stack);
      await transaction.rollback();
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Gift a voucher to another user
   * POST /api/vouchers/:voucherId/gift
   */
  static async giftVoucher(req, res) {
    const transaction = await sequelize.transaction();
    try {
      if (!req.userId) {
        await transaction.rollback();
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const { voucherId } = req.params;
      const { recipientId } = req.body;
      const senderId = req.userId;

      // Validate recipient
      if (!recipientId) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Recipient ID is required"
        });
      }

      // Check if sender and recipient are different
      if (senderId === recipientId) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Cannot gift voucher to yourself"
        });
      }

      // Find the user voucher
      const userVoucher = await UserVoucher.findOne({
        where: {
          id: voucherId,
          userId: senderId
        },
        transaction
      });

      if (!userVoucher) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Voucher not found or you don't own this voucher"
        });
      }

      // Check if voucher is already used
      if (userVoucher.isUsed) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Cannot gift a used voucher"
        });
      }

      // Check if recipient exists
      const recipient = await User.findByPk(recipientId, { transaction });
      if (!recipient) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Recipient user not found"
        });
      }

      // Check if voucher is expired
      const voucherTemplate = await VoucherTemplate.findByPk(userVoucher.templateId, { transaction });
      if (new Date(voucherTemplate.expiryDate) < new Date()) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Cannot gift an expired voucher"
        });
      }

      // Transfer ownership
      await userVoucher.update({
        userId: recipientId,
        giftedAt: new Date(),
        giftedFrom: senderId
      }, { transaction });

      // Emit socket events
      const io = req.app.get('io');
      socketEvents.emitVoucherGifted(io, senderId, recipientId, {
        id: userVoucher.id,
        templateId: voucherTemplate.id,
        name: voucherTemplate.name,
        businessName: voucherTemplate.businessName,
        discountPercent: voucherTemplate.discountPercent,
        newOwnerId: recipientId
      });

      await transaction.commit();

      return res.status(200).json({
        message: "Voucher gifted successfully",
        voucher: {
          id: userVoucher.id,
          templateId: voucherTemplate.id,
          name: voucherTemplate.name,
          businessName: voucherTemplate.businessName,
          discountPercent: voucherTemplate.discountPercent,
          newOwnerId: recipientId
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Voucher gifting error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }

  /**
   * Request to exchange vouchers
   * POST /api/vouchers/:voucherId/request-exchange
   */
  static async requestExchange(req, res) {
    const transaction = await sequelize.transaction();
    try {
      console.log("Exchange request initiated");

      // --- Auth check ---
      const requesterUserId = req.userId;
      console.log("Requester User ID:", requesterUserId);

      if (!requesterUserId) {
        await transaction.rollback();
        console.log("Authentication failed: No user ID");
        return res.status(401).json({ message: "You must be logged in to perform this action." });
      }

      const { voucherId } = req.params;
      const { requestedVoucherId, message } = req.body;
      console.log("voucherId from params:", voucherId);
      console.log("requestedVoucherId from body:", requestedVoucherId);

      // --- Input validation ---
      if (!voucherId || !requestedVoucherId) {
        await transaction.rollback();
        console.log("Validation error: Missing voucher ID(s)");
        return res.status(400).json({ message: "Both voucherId and requestedVoucherId are required." });
      }

      // Convert IDs to numbers for consistency
      const requesterVoucherId = Number(voucherId);
      const targetVoucherId = Number(requestedVoucherId);

      if (requesterVoucherId === targetVoucherId) {
        await transaction.rollback();
        console.log("Validation error: Same voucherId and requestedVoucherId");
        return res.status(400).json({ message: "You cannot exchange a voucher with itself." });
      }

      // --- Fetch vouchers ---
      console.log("Fetching vouchers...");
      const [requesterVoucher, requestedVoucher] = await Promise.all([
        UserVoucher.findByPk(requesterVoucherId, { transaction }),
        UserVoucher.findByPk(targetVoucherId, { transaction })
      ]);

      if (!requesterVoucher) {
        await transaction.rollback();
        console.log(`Requester voucher not found: ${requesterVoucherId}`);
        return res.status(404).json({
          message: "Your voucher not found",
          details: `No voucher found with ID: ${requesterVoucherId}`
        });
      }

      if (!requestedVoucher) {
        await transaction.rollback();
        console.log(`Requested voucher not found: ${targetVoucherId}`);
        return res.status(404).json({
          message: "Requested voucher not found",
          details: `No voucher found with ID: ${targetVoucherId}`
        });
      }

      console.log("Requester voucher:", requesterVoucher.toJSON());
      console.log("Requested voucher:", requestedVoucher.toJSON());

      // --- Ownership & status check ---
      if (requesterVoucher.userId !== requesterUserId) {
        await transaction.rollback();
        console.log("Ownership check failed");
        return res.status(403).json({
          message: "You can only offer your own voucher for exchange.",
          details: `Voucher ${requesterVoucherId} is owned by user ${requesterVoucher.userId}, but requested by ${requesterUserId}`
        });
      }

      if (requesterVoucher.isUsed || requestedVoucher.isUsed) {
        await transaction.rollback();
        console.log("One or both vouchers are already used");
        return res.status(400).json({
          message: "Used vouchers cannot be exchanged.",
          details: {
            requesterVoucherUsed: requesterVoucher.isUsed,
            requestedVoucherUsed: requestedVoucher.isUsed
          }
        });
      }

      // --- Prevent duplicate requests ---
      console.log("Checking for existing exchange request...");
      const existingRequest = await VoucherExchangeRequest.findOne({
        where: {
          requesterVoucherId: requesterVoucherId,
          requestedVoucherId: targetVoucherId,
          status: 'pending'
        },
        transaction
      });

      if (existingRequest) {
        await transaction.rollback();
        console.log("Exchange request already exists:", existingRequest.toJSON());
        return res.status(409).json({
          message: "An exchange request already exists for these vouchers.",
          existingRequest: existingRequest
        });
      }

      // --- Create exchange request ---
      console.log("Creating new exchange request...");
      const exchangeRequest = await VoucherExchangeRequest.create({
        requesterVoucherId: requesterVoucherId,
        requestedVoucherId: targetVoucherId,
        requesterUserId,
        requestedUserId: requestedVoucher.userId,
        message: message || null,
        status: 'pending'
      }, { transaction });

      // Fetch voucher names for socket event
      const [requesterTemplate, requestedTemplate] = await Promise.all([
        VoucherTemplate.findByPk(requesterVoucher.templateId, { transaction }),
        VoucherTemplate.findByPk(requestedVoucher.templateId, { transaction })
      ]);

      // Emit socket events
      const io = req.app.get('io');
      socketEvents.emitExchangeRequest(io, requesterUserId, requestedVoucher.userId, {
        requestId: exchangeRequest.id,
        requesterVoucher: {
          id: requesterVoucher.id,
          name: requesterTemplate ? requesterTemplate.name : 'Unknown'
        },
        requestedVoucher: {
          id: requestedVoucher.id,
          name: requestedTemplate ? requestedTemplate.name : 'Unknown'
        },
        message: message || null,
        createdAt: exchangeRequest.createdAt
      });

      await transaction.commit();
      console.log("Exchange request created successfully:", exchangeRequest.toJSON());

      return res.status(201).json({
        message: "Exchange request sent successfully.",
        request: {
          id: exchangeRequest.id,
          requesterVoucherId: exchangeRequest.requesterVoucherId,
          requestedVoucherId: exchangeRequest.requestedVoucherId,
          requesterUserId: exchangeRequest.requesterUserId,
          requestedUserId: exchangeRequest.requestedUserId,
          status: exchangeRequest.status,
          createdAt: exchangeRequest.createdAt
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Exchange request error:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Respond to exchange request
   * POST /api/vouchers/:requestId/respond-exchange
   */
  static async respondToExchange(req, res) {
    const transaction = await sequelize.transaction();
    try {
      if (!req.userId) {
        await transaction.rollback();
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const { requestId } = req.params;
      const { action } = req.body; // 'accept' or 'reject'
      const userId = req.userId;

      // Validate action
      if (!action || !['accept', 'reject'].includes(action)) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Invalid action. Must be 'accept' or 'reject'"
        });
      }

      // Get the request
      const exchangeRequest = await VoucherExchangeRequest.findByPk(requestId, { transaction });

      if (!exchangeRequest) {
        await transaction.rollback();
        return res.status(404).json({
          message: "Exchange request not found"
        });
      }

      // Check ownership
      if (exchangeRequest.requestedUserId !== userId) {
        await transaction.rollback();
        return res.status(403).json({
          message: "You don't have permission to respond to this request"
        });
      }

      // Check if already responded
      if (exchangeRequest.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({
          message: "Request has already been processed"
        });
      }

      // Get both vouchers
      const requesterVoucher = await UserVoucher.findByPk(exchangeRequest.requesterVoucherId, { transaction });
      const requestedVoucher = await UserVoucher.findByPk(exchangeRequest.requestedVoucherId, { transaction });

      // Validate vouchers
      if (!requesterVoucher || !requestedVoucher) {
        await transaction.rollback();
        return res.status(404).json({
          message: "One or both vouchers not found"
        });
      }

      // Check if vouchers are still available
      if (requesterVoucher.isUsed || requestedVoucher.isUsed) {
        await transaction.rollback();
        return res.status(400).json({
          message: "One or both vouchers have been used"
        });
      }

      if (action === 'accept') {
        // Exchange the vouchers
        await requesterVoucher.update({ userId: exchangeRequest.requestedUserId }, { transaction });
        await requestedVoucher.update({ userId: exchangeRequest.requesterUserId }, { transaction });
      }

      // Update request status
      await exchangeRequest.update({
        status: action === 'accept' ? 'accepted' : 'rejected'
      }, { transaction });

      // Emit socket events
      const io = req.app.get('io');
      socketEvents.emitExchangeResponse(io, exchangeRequest.requesterUserId, userId, {
        requestId: exchangeRequest.id,
        action,
        requesterVoucher: {
          id: requesterVoucher.id,
          newOwnerId: action === 'accept' ? exchangeRequest.requestedUserId : exchangeRequest.requesterUserId
        },
        requestedVoucher: {
          id: requestedVoucher.id,
          newOwnerId: action === 'accept' ? exchangeRequest.requesterUserId : exchangeRequest.requestedUserId
        },
        updatedAt: exchangeRequest.updatedAt
      });

      await transaction.commit();

      return res.status(200).json({
        message: `Exchange request ${action === 'accept' ? 'accepted' : 'rejected'}`,
        request: exchangeRequest
      });

    } catch (error) {
      await transaction.rollback();
      console.error("Exchange response error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }

  /**
   * Get all vouchers ever owned by a user (including used, unused, gifted, and exchanged)
   * GET /api/users/:userId/vouchers
   */
  static async getAllUserVouchers(req, res) {
    try {
      const { userId } = req.params;
      const Op = require('sequelize').Op;

      // Validate user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Get all vouchers where the user is currently the owner
      const currentVouchers = await UserVoucher.findAll({
        where: { userId: userId }
      });

      // Get vouchers gifted to this user (received)
      const receivedVouchers = await UserVoucher.findAll({
        where: {
          userId: userId,
          giftedFrom: { [Op.ne]: null }
        }
      });

      // Get vouchers this user gifted to others (transferred)
      const transferredVouchers = await UserVoucher.findAll({
        where: { giftedFrom: userId }
      });

      // Manually fetch templates for current vouchers
      const currentVoucherDetails = await Promise.all(
        currentVouchers.map(async (voucher) => {
          const template = await VoucherTemplate.findByPk(voucher.templateId);

          return {
            id: voucher.id,
            templateId: voucher.templateId,
            name: template ? template.name : 'Unknown',
            businessName: template ? template.businessName : 'Unknown',
            discountPercent: template ? template.discountPercent : 0,
            validDays: template ? template.validDays : [],
            expiryDate: template ? template.expiryDate : null,
            isUsed: voucher.isUsed,
            usedAt: voucher.usedAt,
            claimedAt: voucher.createdAt,
            uniqueCode: voucher.uniqueCode,
            category: voucher.isUsed ? 'used' : 'unused',
            receivedFrom: voucher.giftedFrom ? 'gift' : 'claimed',
            giftedFrom: voucher.giftedFrom,
            businessImage: template ? template.businessImage : null
          };
        })
      );

      // Process received vouchers
      const receivedVoucherDetails = await Promise.all(
        receivedVouchers.map(async (voucher) => {
          const template = await VoucherTemplate.findByPk(voucher.templateId);
          const giftedFromUser = await User.findByPk(voucher.giftedFrom);

          return {
            id: voucher.id,
            templateId: voucher.templateId,
            name: template ? template.name : 'Unknown',
            businessName: template ? template.businessName : 'Unknown',
            discountPercent: template ? template.discountPercent : 0,
            validDays: template ? template.validDays : [],
            expiryDate: template ? template.expiryDate : null,
            isUsed: voucher.isUsed,
            usedAt: voucher.usedAt,
            receivedAt: voucher.giftedAt,
            uniqueCode: voucher.uniqueCode,
            category: 'received',
            giftedFrom: voucher.giftedFrom,
            giftedFromName: giftedFromUser ? `${giftedFromUser.firstName} ${giftedFromUser.lastName}` : 'Unknown User',
            businessImage: template ? template.businessImage : null
          };
        })
      );

      // Process transferred vouchers
      const transferredVoucherDetails = await Promise.all(
        transferredVouchers.map(async (voucher) => {
          const template = await VoucherTemplate.findByPk(voucher.templateId);
          const transferredToUser = await User.findByPk(voucher.userId);

          return {
            id: voucher.id,
            templateId: voucher.templateId,
            name: template ? template.name : 'Unknown',
            businessName: template ? template.businessName : 'Unknown',
            discountPercent: template ? template.discountPercent : 0,
            validDays: template ? template.validDays : [],
            expiryDate: template ? template.expiryDate : null,
            isUsed: voucher.isUsed,
            usedAt: voucher.usedAt,
            transferredAt: voucher.giftedAt,
            category: 'transferred',
            transferredTo: voucher.userId,
            transferredToName: transferredToUser ? `${transferredToUser.firstName} ${transferredToUser.lastName}` : 'Unknown User',
            businessImage: template ? template.businessImage : null
          };
        })
      );

      // Get all exchange requests where the user was involved
      const exchangeRequests = await VoucherExchangeRequest.findAll({
        where: {
          [Op.or]: [
            { requesterUserId: userId },
            { requestedUserId: userId }
          ],
          status: 'accepted'
        }
      });

      // Manually fetch exchange details
      const exchangeDetails = await Promise.all(
        exchangeRequests.flatMap(async (req) => {
          const items = [];

          // Fetch vouchers involved in the exchange
          const requesterVoucher = await UserVoucher.findByPk(req.requesterVoucherId);
          const requestedVoucher = await UserVoucher.findByPk(req.requestedVoucherId);

          // Fetch templates for these vouchers
          const requesterTemplate = requesterVoucher ?
            await VoucherTemplate.findByPk(requesterVoucher.templateId) : null;
          const requestedTemplate = requestedVoucher ?
            await VoucherTemplate.findByPk(requestedVoucher.templateId) : null;

          // If user was requester (sent this voucher)
          if (req.requesterUserId == userId && requesterVoucher && requesterTemplate && requestedVoucher && requestedTemplate) {
            items.push({
              id: requesterVoucher.id,
              templateId: requesterVoucher.templateId,
              name: requesterTemplate.name,
              businessName: requesterTemplate.businessName,
              discountPercent: requesterTemplate.discountPercent,
              validDays: requesterTemplate.validDays,
              expiryDate: requesterTemplate.expiryDate,
              category: 'sent_exchange',
              exchangedAt: req.updatedAt,
              exchangedFor: {
                voucherId: requestedVoucher.id,
                name: requestedTemplate.name,
                businessName: requestedTemplate.businessName,
                validDays: requestedTemplate.validDays
              },
              businessImage: requesterTemplate.businessImage
            });
          }

          // If user was requested user (received this voucher)
          if (req.requestedUserId == userId && requestedVoucher && requestedTemplate && requesterVoucher && requesterTemplate) {
            items.push({
              id: requestedVoucher.id,
              templateId: requestedVoucher.templateId,
              name: requestedTemplate.name,
              businessName: requestedTemplate.businessName,
              discountPercent: requestedTemplate.discountPercent,
              validDays: requestedTemplate.validDays,
              expiryDate: requestedTemplate.expiryDate,
              category: 'received_exchange',
              exchangedAt: req.updatedAt,
              exchangedFor: {
                voucherId: requesterVoucher.id,
                name: requesterTemplate.name,
                businessName: requesterTemplate.businessName,
                validDays: requesterTemplate.validDays
              },
              businessImage: requestedTemplate.businessImage
            });
          }

          return items;
        })
      );

      // Flatten the array of arrays
      const flattenedExchangeDetails = exchangeDetails.flat();

      // Get all pending exchange requests where user is the requested party
      const pendingRequests = await VoucherExchangeRequest.findAll({
        where: {
          requestedUserId: userId,
          status: 'pending'
        }
      });

      // Manually fetch details for pending exchange requests
      const pendingExchangeDetails = await Promise.all(
        pendingRequests.map(async (req) => {
          // Fetch vouchers involved in the pending exchange
          const requesterVoucher = await UserVoucher.findByPk(req.requesterVoucherId);
          const requestedVoucher = await UserVoucher.findByPk(req.requestedVoucherId);

          // Fetch templates and requester user information
          const requesterTemplate = requesterVoucher ?
            await VoucherTemplate.findByPk(requesterVoucher.templateId) : null;
          const requestedTemplate = requestedVoucher ?
            await VoucherTemplate.findByPk(requestedVoucher.templateId) : null;
          const requesterUser = await User.findByPk(req.requesterUserId);

          return {
            requestId: req.id,
            createdAt: req.createdAt,
            message: req.message,
            requesterInfo: {
              userId: req.requesterUserId,
              name: requesterUser ? `${requesterUser.firstName} ${requesterUser.lastName}` : 'Unknown',
            },
            vouchers: {
              theirVoucher: {
                id: requesterVoucher ? requesterVoucher.id : null,
                templateId: requesterVoucher ? requesterVoucher.templateId : null,
                name: requesterTemplate ? requesterTemplate.name : 'Unknown',
                businessName: requesterTemplate ? requesterTemplate.businessName : 'Unknown',
                discountPercent: requesterTemplate ? requesterTemplate.discountPercent : 0,
                validDays: requesterTemplate ? requesterTemplate.validDays : [],
                expiryDate: requesterTemplate ? requesterTemplate.expiryDate : null,
                businessImage: requesterTemplate ? requesterTemplate.businessImage : null
              },
              yourVoucher: {
                id: requestedVoucher ? requestedVoucher.id : null,
                templateId: requestedVoucher ? requestedVoucher.templateId : null,
                name: requestedTemplate ? requestedTemplate.name : 'Unknown',
                businessName: requestedTemplate ? requestedTemplate.businessName : 'Unknown',
                discountPercent: requestedTemplate ? requestedTemplate.discountPercent : 0,
                validDays: requestedTemplate ? requestedTemplate.validDays : [],
                expiryDate: requestedTemplate ? requestedTemplate.expiryDate : null,
                businessImage: requestedTemplate ? requestedTemplate.businessImage : null
              }
            }
          };
        })
      );

      // Calculate stats with detailed categories
      const stats = {
        total: currentVoucherDetails.length + transferredVoucherDetails.length + flattenedExchangeDetails.length,
        unused: currentVoucherDetails.filter(v => v.category === 'unused').length,
        used: currentVoucherDetails.filter(v => v.category === 'used').length,
        received: receivedVoucherDetails.length,
        transferred: transferredVoucherDetails.length,
        sentExchanged: flattenedExchangeDetails.filter(v => v.category === 'sent_exchange').length,
        receivedExchanged: flattenedExchangeDetails.filter(v => v.category === 'received_exchange').length,
        pendingRequests: pendingExchangeDetails.length
      };

      // Organize vouchers by category for the response
      const organizedVouchers = {
        unused: currentVoucherDetails.filter(v => !v.isUsed),
        used: currentVoucherDetails.filter(v => v.isUsed),
        received: receivedVoucherDetails,
        transferred: transferredVoucherDetails,
        exchanged: flattenedExchangeDetails,
        pendingExchangeRequests: pendingExchangeDetails
      };

      return res.status(200).json({
        message: "User vouchers retrieved successfully",
        data: {
          vouchers: organizedVouchers,
          stats: stats
        }
      });

    } catch (error) {
      console.error("Error fetching user vouchers:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }

  /**
   * Get all pending exchange requests (admin view)
   * GET /api/vouchers/exchange-requests/all
   */
  static async getAllPendingExchangeRequests(req, res) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      // Get all pending exchange requests
      const exchangeRequests = await VoucherExchangeRequest.findAll({
        where: {
          status: 'pending'
        },
        order: [['createdAt', 'DESC']] // Newest first
      });

      // Manually fetch details for each request
      const detailedRequests = await Promise.all(
        exchangeRequests.map(async (request) => {
          // Fetch both vouchers
          const [requesterVoucher, requestedVoucher] = await Promise.all([
            UserVoucher.findByPk(request.requesterVoucherId),
            UserVoucher.findByPk(request.requestedVoucherId)
          ]);

          // Fetch templates for both vouchers
          const [requesterTemplate, requestedTemplate] = await Promise.all([
            requesterVoucher ? VoucherTemplate.findByPk(requesterVoucher.templateId) : null,
            requestedVoucher ? VoucherTemplate.findByPk(requestedVoucher.templateId) : null
          ]);

          // Fetch user information
          const [requesterUser, requestedUser] = await Promise.all([
            User.findByPk(request.requesterUserId),
            User.findByPk(request.requestedUserId)
          ]);

          return {
            requestId: request.id,
            createdAt: request.createdAt,
            message: request.message,
            requesterInfo: {
              userId: requesterUser.id,
              name: `${requesterUser.firstName} ${requesterUser.lastName}`
            },
            requestedInfo: {
              userId: requestedUser.id,
              name: `${requestedUser.firstName} ${requestedUser.lastName}`
            },
            vouchers: {
              requesterVoucher: {
                id: requesterVoucher.id,
                templateId: requesterVoucher.templateId,
                name: requesterTemplate.name,
                businessName: requesterTemplate.businessName,
                discountPercent: requesterTemplate.discountPercent,
                validDays: requesterTemplate.validDays,
                expiryDate: requesterTemplate.expiryDate,
                businessImage: requesterTemplate.businessImage
              },
              requestedVoucher: {
                id: requestedVoucher.id,
                templateId: requestedVoucher.templateId,
                name: requestedTemplate.name,
                businessName: requestedTemplate.businessName,
                discountPercent: requestedTemplate.discountPercent,
                validDays: requestedTemplate.validDays,
                expiryDate: requestedTemplate.expiryDate,
                businessImage: requestedTemplate.businessImage
              }
            }
          };
        })
      );

      return res.status(200).json({
        message: "All pending exchange requests retrieved successfully",
        requests: detailedRequests
      });

    } catch (error) {
      console.error("Error fetching all pending exchange requests:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message
      });
    }
  }

/**
 * Get business voucher statistics (most exchanged, most used, least used)
 * GET /api/vouchers/business-stats
 */
// controllers/VoucherController.js
static async getAllPendingExchangeRequests(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    // Get all pending exchange requests (both direct exchanges and market listings)
    const exchangeRequests = await VoucherExchangeRequest.findAll({
      where: {
        status: 'pending'
      },
      order: [['createdAt', 'DESC']]
    });

    // Manually fetch details for each request
    const detailedRequests = await Promise.all(
      exchangeRequests.map(async (request) => {
        // Fetch the requester voucher (always exists)
        const requesterVoucher = await UserVoucher.findByPk(request.requesterVoucherId);
        const requesterTemplate = requesterVoucher ? 
          await VoucherTemplate.findByPk(requesterVoucher.templateId) : null;
        
        // Fetch requested voucher (might not exist for market listings)
        let requestedVoucher = null;
        let requestedTemplate = null;
        if (request.requestedVoucherId) {
          requestedVoucher = await UserVoucher.findByPk(request.requestedVoucherId);
          requestedTemplate = requestedVoucher ? 
            await VoucherTemplate.findByPk(requestedVoucher.templateId) : null;
        }

        // Fetch user information
        const requesterUser = await User.findByPk(request.requesterUserId);
        const requestedUser = request.requestedUserId ? 
          await User.findByPk(request.requestedUserId) : null;

        return {
          requestId: request.id,
          type: request.requestedVoucherId ? 'exchange' : 'market',
          createdAt: request.createdAt,
          message: request.message,
          requesterInfo: {
            userId: requesterUser.id,
            name: `${requesterUser.firstName} ${requesterUser.lastName}`
          },
          requestedInfo: requestedUser ? {
            userId: requestedUser.id,
            name: `${requestedUser.firstName} ${requestedUser.lastName}`
          } : null,
          vouchers: {
            requesterVoucher: {
              id: requesterVoucher.id,
              templateId: requesterVoucher.templateId,
              name: requesterTemplate.name,
              businessName: requesterTemplate.businessName,
              discountPercent: requesterTemplate.discountPercent,
              validDays: requesterTemplate.validDays,
              expiryDate: requesterTemplate.expiryDate,
              businessImage: requesterTemplate.businessImage
            },
            requestedVoucher: requestedVoucher ? {
              id: requestedVoucher.id,
              templateId: requestedVoucher.templateId,
              name: requestedTemplate.name,
              businessName: requestedTemplate.businessName,
              discountPercent: requestedTemplate.discountPercent,
              validDays: requestedTemplate.validDays,
              expiryDate: requestedTemplate.expiryDate,
              businessImage: requestedTemplate.businessImage
            } : null
          }
        };
      })
    );

    return res.status(200).json({
      message: "All pending exchange requests and market listings retrieved successfully",
      requests: detailedRequests
    });

  } catch (error) {
    console.error("Error fetching all pending exchange requests:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * Send a voucher to the market for potential exchange
 * POST /api/vouchers/:voucherId/send-to-market
 */
static async sendToMarket(req, res) {
  const transaction = await sequelize.transaction();
  try {
    if (!req.userId) {
      await transaction.rollback();
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const { voucherId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    // Find the voucher
    const userVoucher = await UserVoucher.findByPk(voucherId, { transaction });
    if (!userVoucher) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Voucher not found"
      });
    }

    // Check ownership
    if (userVoucher.userId !== userId) {
      await transaction.rollback();
      return res.status(403).json({
        message: "You don't own this voucher"
      });
    }

    // Check if voucher is already used
    if (userVoucher.isUsed) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Cannot list a used voucher on the market"
      });
    }

    // Check if already listed
    const existingRequest = await VoucherExchangeRequest.findOne({
      where: {
        requesterVoucherId: voucherId,
        status: 'pending',
        requestedVoucherId: null
      },
      transaction
    });

    if (existingRequest) {
      await transaction.rollback();
      return res.status(400).json({
        message: "This voucher is already listed on the market"
      });
    }

    // Create market listing
    const marketListing = await VoucherExchangeRequest.create({
      requesterVoucherId: voucherId,
      requestedVoucherId: null, // This is what makes it a market listing
      requesterUserId: userId,
      requestedUserId: null, // No specific user requested
      message: message || null,
      status: 'pending'
    }, { transaction });

    // Get voucher details for socket event
    const voucherTemplate = await VoucherTemplate.findByPk(userVoucher.templateId, { transaction });

    // Emit socket event
    const io = req.app.get('io');
    socketEvents.emitMarketListing(io, {
      listingId: marketListing.id,
      voucher: {
        id: userVoucher.id,
        name: voucherTemplate ? voucherTemplate.name : 'Unknown',
        businessName: voucherTemplate ? voucherTemplate.businessName : 'Unknown',
        discountPercent: voucherTemplate ? voucherTemplate.discountPercent : 0,
        validDays: voucherTemplate ? voucherTemplate.validDays : [],
        expiryDate: voucherTemplate ? voucherTemplate.expiryDate : null,
        businessImage: voucherTemplate ? voucherTemplate.businessImage : null
      },
      ownerId: userId,
      message: message || null,
      createdAt: marketListing.createdAt
    });

    await transaction.commit();

    return res.status(201).json({
      message: "Voucher listed on market successfully",
      listing: {
        id: marketListing.id,
        voucherId: marketListing.requesterVoucherId,
        status: marketListing.status,
        createdAt: marketListing.createdAt
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Market listing error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
}

module.exports = VoucherController;