require("dotenv").config();
const { Business, BusinessPosts, User } = require('../models'); // ⬅️ include User
const BusinessService = require("../services/BusinessService");
const { uploadGenericFiles } = require("../utils/upload");
const { Op } = require('sequelize');
const sendEmail = require("../services/sendEmail"); // ⬅️ mailer

const businessController = {
  // Create a new Business
  createBusiness: async (req, res) => {
    try {
      // First handle the file uploads
      await new Promise((resolve, reject) => {
        uploadGenericFiles.fields([
          { name: "logo", maxCount: 1 },
          { name: "cacDoc", maxCount: 1 },
        ])(req, res, (err) => {
          if (err) {
            console.error("Error uploading files:", err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const {
        userId,
        name,
        type,
        address,
        description,
        amenities,
        hours,
        social,
        wifi,
        latitude,
        longitude
      } = req.body;

      // Extract file URLs from S3
      const logoUrl = req.files?.logo?.[0]?.location || null;
      const cacDocUrl = req.files?.cacDoc?.[0]?.location || null;

      // Keep as provided (your service expects arrays/objects already)
      const socialArray = social;
      const wifiArray = wifi;
      const hoursArray = hours;
      const amenitiesArray = amenities;

      // Create the business
      const business = await Business.create({
        userId,
        name,
        type,
        address,
        description,
        logo: logoUrl,
        amenities: amenitiesArray,
        cacDoc: cacDocUrl,
        hours: hoursArray,
        social: socialArray,
        wifi: wifiArray,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      });

      // ---------- BUSINESS WELCOME EMAIL (non-blocking) ----------
      (async () => {
        try {
          // Get owner email
          const owner = userId ? await User.findByPk(userId) : null;
          const to = owner?.email;
          if (!to) {
            console.warn("[createBusiness] No owner email found — skipping business welcome email");
            return;
          }

          const subject = "Welcome to the OTG Business Network 🎉";
          // Reuse same Cloudinary base + assets used in UserController
          const BASE = "https://res.cloudinary.com/doefjylyu/image/upload";
          const IMG = {
            hero: `${BASE}/f_auto,q_auto/hero_hpg6la.png`,
            business: `${BASE}/f_auto,q_auto/business_n2pxwd.png`,
          };

          // Google Form link (as requested)
          const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc_XyST_KIraWXj5J8uTZWhemiAHUg4fCu9Uw06GpIsEPVvLA/viewform";

          const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Welcome to OTG Business</title>
<style>
  @media only screen and (max-width:680px){
    .container{width:100% !important}
    .p16{padding:16px !important}
    .center{text-align:center !important}
  }
  a { color:#1C46FF; }
</style>
</head>
<body style="margin:0;background:#F5F6F8">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F6F8">
    <tr>
      <td align="center" style="padding:24px">
        <table role="presentation" width="640" class="container" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden">
          <!-- Hero -->
          <tr>
            <td>
              <img src="${IMG.hero}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="p16" style="padding:24px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Hey ${name || "there"},</p>
              <p style="margin:0;font-size:16px;line-height:24px;color:#334155">
                You're officially part of the <strong>OTG Business Network</strong>—where good vibes, fast Wi-Fi, and smart visibility come together.
                Every day, thousands of users on OTG search for great spots to work, chill, and connect. And now, your business is on the map!
              </p>
            </td>
          </tr>

          <!-- Business banner -->
          <tr>
            <td>
              <img src="${IMG.business}" width="640" alt="Your Business, Seen by Thousands." style="display:block;width:100%;height:auto" />
            </td>
          </tr>

          <!-- Benefits -->
          <tr>
            <td class="p16" style="padding:16px 28px 8px 28px">
              <ul style="margin:0;padding:0 0 0 18px;color:#334155;font-size:15px;line-height:24px;font-family:Arial,Helvetica,sans-serif">
                <li style="margin-bottom:8px"><strong>Show off your space</strong></li>
                <li style="margin-bottom:8px"><strong>Get real-time reviews and feedback</strong></li>
                <li style="margin-bottom:8px"><strong>Offer perks and drive loyalty</strong></li>
                <li style="margin-bottom:8px"><strong>Access smart insights to grow your business</strong></li>
              </ul>
            </td>
          </tr>

          <!-- Next steps + CTA -->
          <tr>
            <td class="p16" style="padding:8px 28px 4px 28px;font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:15px;line-height:24px">
              <p style="margin:0 0 12px 0">
                <strong>Next steps:</strong> Complete this quick form so we can verify and enrich your listing.
              </p>
              <a href="${FORM_URL}" style="display:inline-block;background:#1C46FF;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:10px;font-size:14px">
                Complete Business Form
              </a>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td class="p16" style="padding:20px 28px 24px 28px;font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;line-height:22px">
              <p style="margin:0 0 12px 0">We're excited to have you on board. Let's help people find you faster.</p>
              <p style="margin:0 0 12px 0">Welcome to the future of smart discovery.</p>
              <p style="margin:0 0 4px 0">Stay connected. Stay rewarded. Stay OTG.</p>
              <p style="margin:0">With 💛,<br/>The OTG Team</p>
              <p style="margin:16px 0 0 0;color:#94A3B8;font-size:12px;text-align:center">&copy; ${new Date().getFullYear()} OnTheGo Africa. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

          await sendEmail({ to, subject, html });
          console.log("[createBusiness] Business welcome email sent to:", to);
        } catch (err) {
          console.error("[createBusiness] Failed to send business welcome email:", err.message);
        }
      })();
      // ---------- END BUSINESS WELCOME EMAIL ----------

      res.status(201).json({
        message: "Business created successfully",
        data: business,
      });
    } catch (error) {
      console.error("Error creating business:", error);
      const statusCode = error.message.includes("upload") ? 400 : 500;
      res.status(statusCode).json({
        message: "Error creating business",
        error: error.message,
      });
    }
  },

  // Get all Businesses
  getAllBusinesses: async (req, res) => {
    const { offset } = req.query;
    try {
      const businesses = await BusinessService.getAllBusinesses(offset);

      return res.status(200).json({
        businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get all Businesses
  getAllBusiness: async (req, res) => {
    const { offset } = req.query;
    try {
      const businesses = await BusinessService.getAllBusiness(offset);
      return res.status(200).json(businesses);
    } catch (error) {
      console.error("❌ Error retrieving businesses:", error);
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error.message,
      });
    }
  },

  // Get all Defibrillator
  getAllDefibrillator: async (req, res) => {
    try {
      const defibrillators = await BusinessService.getAllDefibrillator();

      return res.status(200).json(defibrillators);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Failed to retrieve defibrillators",
        error: error.message,
      });
    }
  },

  // Get a user business
  getBusinessByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const business = await BusinessService.getBusinessByUserId(userId);

      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }

      return res.status(200).json(business);
    } catch (error) {
      res.status(500).json(error.message);
    }
  },

  // Get business by id
  getBusinessById: async (req, res) => {
    try {
      const { businessId } = req.params;
      const business = await BusinessService.getBusinessById(businessId);

      if (!business) {
        return res.status(404).json({
          message: "Business not found",
        });
      }

      return res.status(200).json(business);
    } catch (error) {
      res.status(500).json(error.message);
    }
  },

  updateBusiness: async (req, res) => {
    try {
      console.log("➡️ updateBusiness called");
      console.log("📝 Params:", req.params);
      console.log("📝 Body before file processing:", req.body);

      await new Promise((resolve, reject) => {
        uploadGenericFiles.fields([])(req, res, (err) => {
          if (err) {
            console.error("❌ File upload error:", err);
            reject(new Error(`File upload failed: ${err.message}`));
          } else {
            console.log("✅ File upload completed successfully.");
            console.log("📎 Uploaded Files:", req.files);
            resolve();
          }
        });
      });

      const { id } = req.params;
      const {
        name,
        type,
        address,
        description,
        amenities,
        hours,
        social,
        wifi,
        wifiPlans,
        bankName,
        accountName,
        accountNumber
      } = req.body;

      const business = await Business.findByPk(id);
      if (!business) {
        console.warn("⚠️ Business not found with ID:", id);
        return res.status(404).json({ message: "Business not found" });
      }

      // Parse amenities safely
      let parsedAmenities = business.amenities; // default to existing
      if (amenities) {
        try {
          parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
        } catch (e) {
          console.error("❌ Error parsing amenities:", e);
          parsedAmenities = business.amenities; // fallback
        }
      }

      // Check if any bank detail is being uploaded or changed
      const bankDetailsChanged =
        (bankName && bankName !== business.bankName) ||
        (accountName && accountName !== business.accountName) ||
        (accountNumber && accountNumber !== business.accountNumber);

      const updateData = {
        name: name || business.name,
        type: type || business.type,
        address: address || business.address,
        description: description || business.description,
        logo: req.files?.logo?.[0]?.location || business.logo,
        cacDoc: req.files?.cacDoc?.[0]?.location || business.cacDoc,
        amenities: parsedAmenities,
        hours: hours ? JSON.parse(hours) : business.hours,
        social: social ? JSON.parse(social) : business.social,
        wifi: wifi ? JSON.parse(wifi) : business.wifi,
        wifiPlans: wifiPlans ? JSON.parse(wifiPlans) : business.wifiPlans,
        bankName: bankName === "" ? null : (bankName || business.bankName),
        accountName: accountName === "" ? null : (accountName || business.accountName),
        accountNumber: accountNumber === "" ? null : (accountNumber || business.accountNumber),
      };

      if (bankDetailsChanged) {
        updateData.splitCode = null;
        console.log("🔄 Bank details changed — splitCode cleared.");
      }

      await business.update(updateData);

      const responseData = {
        ...business.toJSON(),
        social: business.social,
        wifi: business.wifi,
        wifiPlans: business.wifiPlans,
        amenities: business.amenities,
        hours: business.hours,
      };

      res.status(200).json({
        message: "Business updated successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("🔥 Error in updateBusiness:", error);
      const statusCode = error.message.includes("upload") ? 400 : 500;
      res.status(statusCode).json({
        message: "Error updating business",
        error: error.message.replace("File upload failed: ", ""),
      });
    }
  },

  getBusinessPosts: async (req, res) => {
    const { businessId } = req.params;

    try {
      const business = await Business.findByPk(businessId, {
        attributes: ["id", "name", "type", "logo"],
        include: {
          model: BusinessPosts,
          as: "BusinessPosts",
          attributes: ["id", "media", "postText", "createdAt"],
        },
      });

      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.status(200).json({
        message: "Business info with posts retrieved successfully",
        business,
      });
    } catch (error) {
      console.error("Error retrieving business info with posts:", error);
      res.status(500).json({
        message: "Error retrieving business info with posts",
        error: error.message,
      });
    }
  },

  addWifiScanner: async (req, res) => {
    try {
      const { businessId } = req.params;
      const { userId, location, wifiName } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      const user = await BusinessService.addWifiScanner(
        userId,
        businessId,
        location,
        wifiName
      );
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.status(201).json({ message: user.message, user: user.data });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getAllWifiScan: async (req, res) => {
    try {
      const { businessId } = req.params;
      const wifiScanners = await BusinessService.getAllWifiScan(businessId);
      if (!wifiScanners)
        return res.status(404).json({ message: "No record found" });
      return res.status(200).json({ wifiScanners });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getAllRepeatedCustomers: async (req, res) => {
    try {
      const { businessId } = req.params;
      const wifiScanners = await BusinessService.getAllRepeatedCustomers(
        businessId
      );
      if (!wifiScanners)
        return res.status(404).json({ message: "No record found" });
      return res.status(200).json({ wifiScanners });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // business.controller.js
  filterBusinesses: async (req, res) => {
    try {
      const filters = {
        wifi: req.query.wifi === "true",
        parkingSpace: req.query.parkingSpace === "true",
        airConditioning: req.query.airConditioning === "true",
        petFriendly: req.query.petFriendly === "true",
      };

      const businesses = await BusinessService.filterBusinessesAlt(filters);

      return res.status(200).json({ businesses });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to filter businesses",
        error: error.message,
      });
    }
  },

  searchBusinessesByName: async (req, res) => {
    try {
      const searchTerm = req.query.q;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!searchTerm) {
        return res.status(400).json({
          message: "Search term is required",
          error: "Missing 'q' parameter",
        });
      }

      const { businesses, total } =
        await BusinessService.searchBusinessesByName(searchTerm, page, limit);

      return res.status(200).json({
        count: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        businesses,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Failed to search businesses",
        error: error.message,
      });
    }
  },

  searchBusinessesName: async (req, res) => {
    try {
      const { searchTerm } = req.query;
      const businesses = await Business.findAll({ where:{ 
          name: { [Op.like]: `%${searchTerm}%` }
        },
      });
      return res.status(200).json({ businesses, message: "Businesses fetched "});

    } catch (error) {
      return res.status(500).json({
        message: "Failed to search businesses",
        error: error.message,
      });
    }
  },

  searchBusinessesByLocation: async (req, res) => {
    const { latitude, longitude } = req.query;
    try {
      const businesses = await BusinessService.searchBusinessbyLocation(latitude, longitude);
      if (!businesses) return res.status(404).json({ message: "No record found" });
      return res.status(200).json({ businesses });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = businessController;
