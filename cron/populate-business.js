const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const UserService = require("../services/UserService");
const { Business } = require("../models");

// Process CSV file
const processBusinessController = {
  processBusinesses: async (req, res) => {
    const results = [];

    fs.createReadStream("cron/businesses.csv")
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // Process each business
          for (const business of results) {
            const userId = await createUser({
              firstName: business.name,
              username: business.username || generateUsername(business.name),
              email: business.email || generateEmail(business.name),
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
            });

            console.log(`Created business: ${business.name}`);
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
      //  return;
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
      phone_number: "",
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
  const { userId, name, type, address, longitude, latitude, zone } =
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
    });
  } catch (error) {
    console.error("Error creating business:", error);
  }
}

function generateUsername(businessName) {
  if (!businessName || typeof businessName !== "string") {
    return `user${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Remove all non-alphabetic characters and keep only letters and spaces
  const cleanedName = businessName.replace(/[^a-zA-Z\s]/g, "").trim();

  // Extract words with at least 2 letters
  const words = cleanedName
    .split(/\s+/)
    .filter((word) => word.length >= 2)
    .map((word) => word.toLowerCase());

  let prefix = "";

  if (words.length >= 2) {
    // Take first 2 letters from first two words
    prefix = words[0].slice(0, 2) + words[1].slice(0, 2);
  } else if (words.length === 1) {
    // Take first 4 letters if only one word exists
    prefix = words[0].slice(0, 4);
  } else {
    // Fallback if no valid words
    return `biz${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Pad with 'a' if shorter than 4 characters
  const paddedPrefix = prefix.padEnd(4, "a").slice(0, 4);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `@${paddedPrefix}${randomSuffix}`;
}

function generateEmail(businessName, existingEmails = new Set()) {
  if (!businessName || typeof businessName !== "string") {
    return generateFallbackEmail(existingEmails);
  }

  // Enhanced cleaning - keep letters and remove all other characters
  const cleanLetters = businessName
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase()
    .split("");

  if (cleanLetters.length === 0) {
    return generateFallbackEmail(existingEmails);
  }

  // Generate multiple 6-letter variants with improved strategies
  const variants = [
    // Strategy 1: First 6 letters
    cleanLetters.slice(0, 6).join(""),

    // Strategy 2: First 3 + last 3 letters
    cleanLetters.slice(0, 3).join("") + cleanLetters.slice(-3).join(""),

    // Strategy 3: First 2 + middle 2 + last 2 letters
    cleanLetters.slice(0, 2).join("") +
      cleanLetters
        .slice(
          Math.floor(cleanLetters.length / 2) - 1,
          Math.floor(cleanLetters.length / 2) + 1
        )
        .join("") +
      cleanLetters.slice(-2).join("").padEnd(2, "a"),

    // Strategy 4: First letter of each word (minimum 6 letters)
    businessName
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-Z]/g, "")[0] || "a")
      .join("")
      .toLowerCase()
      .padEnd(6, "a")
      .slice(0, 6),

    // Strategy 5: First letter + vowels in order
    [cleanLetters[0]]
      .concat(cleanLetters.filter((c) => "aeiou".includes(c)))
      .join("")
      .padEnd(6, "a")
      .slice(0, 6),
  ]
    .filter((v) => v.length === 6)
    .map((v) => v + "@otgafrica.com");

  // Try each variant until we find an unused one
  for (const variant of variants) {
    if (!existingEmails.has(variant)) {
      return variant;
    }
  }

  // Final fallback
  return generateFallbackEmail(existingEmails);
}

function generateFallbackEmail(existingEmails) {
  let email;
  do {
    const randomChars = Math.random()
      .toString(36)
      .replace(/[^a-z]/g, "")
      .slice(0, 6)
      .padEnd(6, "a");
    email = `${randomChars}@otgafrica.com`;
  } while (existingEmails.has(email));

  return email;
}
