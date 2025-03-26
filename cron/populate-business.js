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
              password: "otgAfrica",
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

    console.log("User created successfully", user);
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
  if (!businessName)
    return `user${Math.floor(1000 + Math.random() * 9000)}@otgafrica.com`;

  return (
    businessName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 30) + Math.floor(1000 + Math.random() * 9000)
  );
}

function generateEmail(businessName) {
  if (!businessName)
    return `user${Math.floor(1000 + Math.random() * 9000)}@otgafrica.com`;

  return (
    businessName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 30) + "@otgafrica.com"
  );
}
