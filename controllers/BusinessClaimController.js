// controllers/BusinessClaimController.js
const Business = require("../models/Business");
const BusinessClaim = require("../models/BusinessClaim");
const User = require("../models/User");
const AWS = require("aws-sdk");
const admin = require('firebase-admin');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});


// This makes them compatible with the catchErrors wrapper
exports.submitClaim = async (req, res) => {
    const { businessName, legalName, businessEmail, userId } = req.body;
    
    if (!businessName || !legalName || !businessEmail || !userId) {
        return res.status(400).json({ 
            success: false,
            message: "All required fields must be provided" 
        });
    }

    // Upload documents to S3 if they exist
    let cacDocumentUrl = null;
    let optionalDocumentUrl = null;

    if (req.files?.cacDocument) {
        const cacFile = req.files.cacDocument[0];
        cacDocumentUrl = cacFile.location;
    }

    if (req.files?.optionalDocument) {
        const optionalFile = req.files.optionalDocument[0];
        optionalDocumentUrl = optionalFile.location;
    }

    if (!cacDocumentUrl) {
        return res.status(400).json({ 
            success: false,
            message: "CAC document is required" 
        });
    }

    // Create a new business claim record
    const newClaim = await BusinessClaim.create({
        businessName,
        legalName,
        email: businessEmail,
        userId,
        cacDocumentUrl,
        optionalDocumentUrl,
        status: 'pending_verification'
    });

    // Send notification to admin
    try {
        const message = {
            notification: {
                title: 'New Business Claim Request',
                body: `${businessName} has submitted a claim request`
            },
            data: {
                type: 'business_claim',
                claimId: newClaim.id.toString(),
                timestamp: Date.now().toString()
            },
            topic: 'admin_notifications' // or specific admin device tokens
        };

        await admin.messaging().send(message);
    } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
    }

    return res.status(201).json({
        success: true,
        message: "Business claim submitted successfully. It will be reviewed shortly.",
        claim: newClaim
    });
};

exports.getClaimStatus = async (req, res) => {
  const { claimId } = req.params;
  
  const claim = await BusinessClaim.findByPk(claimId);
  if (!claim) {
    return res.status(404).json({ 
      success: false,
      message: "Business claim not found" 
    });
  }

  return res.status(200).json({
    success: true,
    status: claim.status,
    businessId: claim.businessId
  });
};

exports.getUserClaims = async (req, res) => {
  const { userId } = req.params;
  
  const claims = await BusinessClaim.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });

  return res.status(200).json({
    success: true,
    claims
  });
};

exports.approveClaim = async (req, res) => {
  const { claimId } = req.params;
  
  const claim = await BusinessClaim.findByPk(claimId);
  if (!claim) {
    return res.status(404).json({ 
      success: false,
      message: "Business claim not found" 
    });
  }

  if (claim.status !== 'pending_verification') {
    return res.status(400).json({ 
      success: false,
      message: `Claim has already been ${claim.status}` 
    });
  }

  // Create a new business from the claim data
  const newBusiness = await Business.create({
    userId: claim.userId,
    name: claim.businessName,
    legalName: claim.legalName,
    email: claim.email,
    cacDocumentUrl: claim.cacDocumentUrl,
    optionalDocumentUrl: claim.optionalDocumentUrl,
    isVerified: true,
    status: 'verified'
  });

  // Update the claim with the new business ID and set status to approved
  await claim.update({
    status: 'approved',
    businessId: newBusiness.id
  });

  // Notify the user that their claim was approved
  try {
    const user = await User.findByPk(claim.userId);
    if (user && user.fcmToken) {
      const message = {
        notification: {
          title: 'Business Claim Approved',
          body: `Your claim for ${claim.businessName} has been approved!`
        },
        data: {
          type: 'claim_approved',
          businessId: newBusiness.id.toString(),
          timestamp: Date.now().toString()
        },
        token: user.fcmToken
      };

      await admin.messaging().send(message);
    }
  } catch (notificationError) {
    console.error('Error sending notification:', notificationError);
  }

  return res.status(200).json({
    success: true,
    message: "Business claim approved successfully",
    business: newBusiness
  });
};

exports.rejectClaim = async (req, res) => {
  const { claimId } = req.params;
  const { reason } = req.body;
  
  const claim = await BusinessClaim.findByPk(claimId);
  if (!claim) {
    return res.status(404).json({ 
      success: false,
      message: "Business claim not found" 
    });
  }

  if (claim.status !== 'pending_verification') {
    return res.status(400).json({ 
      success: false,
      message: `Claim has already been ${claim.status}` 
    });
  }

  // Update the claim status to rejected
  await claim.update({
    status: 'rejected',
    rejectionReason: reason || 'No reason provided'
  });

  // Notify the user that their claim was rejected
  try {
    const user = await User.findByPk(claim.userId);
    if (user && user.fcmToken) {
      const message = {
        notification: {
          title: 'Business Claim Rejected',
          body: `Your claim for ${claim.businessName} was not approved`
        },
        data: {
          type: 'claim_rejected',
          claimId: claim.id.toString(),
          reason: claim.rejectionReason,
          timestamp: Date.now().toString()
        },
        token: user.fcmToken
      };

      await admin.messaging().send(message);
    }
  } catch (notificationError) {
    console.error('Error sending notification:', notificationError);
  }

  return res.status(200).json({
    success: true,
    message: "Business claim rejected successfully",
    claim
  });
};