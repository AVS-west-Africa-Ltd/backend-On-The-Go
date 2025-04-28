const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const UserService = require("../services/UserService");
const { Business } = require("../models");

// Track processed businesses to avoid duplicates
const processedBusinesses = new Map();

// Process CSV file
const processBusinessController = {
  processBusinesses: async (req, res) => {
    const results = [];

    fs.createReadStream("cron/businesses_with_logos.csv")
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // Process each business
          for (const business of results) {
            const businessKey = `${business.name.toLowerCase()}-${
              business.longitude
            }`;

            // Skip if we've already processed this business at this location
            if (processedBusinesses.has(businessKey)) {
              console.log(
                `Skipping duplicate business at same location: ${business.name}`
              );
              continue;
            }

            // Mark this business as processed
            processedBusinesses.set(businessKey, true);

            const userId = await createUser({
              firstName: business.name,
              username: business.username || generateUsername(business.name),
              email: business.email || generateEmail(business.name, results),
              phone_number: business.phone || "",
              password: "otgafrica",
            });

            await createBusiness({
              userId: userId,
              name: business.name,
              address: business.address,
              type: business.type,
              longitude: business.longitude,
              latitude: business.latitude,
              zone: business.zone,
              logo: business.google_logo_url || null,
            });

            console.log(
              `Created business: ${business.name} at ${business.longitude},${business.latitude}`
            );
          }
        } catch (error) {
          console.error("Error processing businesses:", error);
        } finally {
          return res.json({ message: "Businesses processed successfully" });
        }
      });
  },
};

module.exports = processBusinessController;

// Helper functions
async function createUser(userData) {
  try {
    const { username, email, password } = userData;

    if (!email || !password) {
      console.log("All fields are required");
      return;
    }

    let payload = { where: { email: email } };
    const isUserRegistered = await UserService.getUserByEmailOrUsername(
      payload
    );
    if (isUserRegistered) {
      console.log("User already registered");
      // Generate a new unique email if this one exists
      userData.email = generateEmail(userData.firstName, [], true);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userPayload = {
      ...userData,
      password: hashedPassword,
      followersCount: 0,
      followingCount: 0,
      userType: "business",
      createdAt: new Date(),
      updatedAt: new Date(),
      placesVisited: "",
      lastName: "",
      picture: "",
      bio: "",
      interests: "",
      profession: "",
      skills: "",
      gender: "",
      resetPasswordOTP: "",
      resetPasswordExpires: "",
    };

    // Create user with all required fields
    const user = await UserService.createUser(userPayload);
    return user.id;
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

async function createBusiness(businessData) {
  const { userId, name, type, address, longitude, latitude, zone, logo } =
    businessData;

  try {
    const business = await Business.create({
      userId,
      name,
      type,
      address,
      longitude,
      latitude,
      zone,
      logo, // Save the logo URL
    });
  } catch (error) {
    console.error("Error creating business:", error);
  }
}

function generateUsername(businessName) {
  if (!businessName || typeof businessName !== "string") {
    return `user${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Keep alphanumeric characters, underscores, and hyphens
  const cleanedName = businessName
    .replace(/[^a-zA-Z0-9_\-\s]/g, "")
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .toLowerCase()
    .trim();

  // Extract valid parts (at least 2 characters)
  const validParts = cleanedName
    .split(/[_\-]+/)
    .filter((part) => part.length >= 2);

  let prefix = "";

  if (validParts.length >= 2) {
    prefix = validParts[0].slice(0, 2) + validParts[1].slice(0, 2);
  } else if (validParts.length === 1) {
    prefix = validParts[0].slice(0, 4);
  } else {
    // Fallback if no valid parts (e.g., name was all special chars)
    prefix = "biz";
  }

  // Ensure we have exactly 4 characters for the prefix
  const paddedPrefix = prefix.padEnd(4, "x").slice(0, 4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `@${paddedPrefix}${randomSuffix}`;
}

function generateEmail(businessName, allBusinesses = [], forceUnique = false) {
  if (!businessName || typeof businessName !== "string") {
    return generateFallbackEmail(new Set());
  }

  // Get all existing emails to ensure uniqueness
  const existingEmails = new Set(
    allBusinesses.map((b) => b.email).filter(Boolean)
  );

  // Keep alphanumeric characters and some special chars that are email-safe
  const cleanLetters = businessName
    .replace(/[^a-zA-Z0-9_+\-.]/g, "")
    .toLowerCase();

  if (cleanLetters.length === 0) {
    return generateFallbackEmail(existingEmails);
  }

  // Generate base email name (max 20 chars)
  let baseName = cleanLetters.slice(0, 20);

  // If the name starts with a number, prepend 'biz'
  if (/^[0-9]/.test(baseName)) {
    baseName = "biz" + baseName;
  }

  // Generate variants
  const variants = [
    baseName,
    baseName + Math.floor(10 + Math.random() * 90), // Add random 2-digit number
    baseName.replace(/[^a-zA-Z]/g, "").slice(0, 6) +
      Math.floor(100 + Math.random() * 900),
    baseName.split(/[^a-zA-Z]/)[0] + Math.floor(1000 + Math.random() * 9000),
  ].map((v) => v.toLowerCase() + "@otgafrica.com");

  // Find first unique variant
  for (const variant of variants) {
    if (!existingEmails.has(variant)) {
      return variant;
    }
  }

  // If all variants exist (unlikely), generate completely random
  return generateFallbackEmail(existingEmails);
}

function generateFallbackEmail(existingEmails) {
  let email;
  do {
    const randomChars = Math.random()
      .toString(36)
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 8)
      .padEnd(8, "x");
    email = `${randomChars}@otgafrica.com`;
  } while (existingEmails.has(email));

  return email;
}
