const jwtUtil = require("../utils/jwtUtil");

const {
  Amenity,
  Profile,
  sequelize,
  Document,
  OpeningHour,
  RewardRedeemHour,
  User,
  Social,
  Post
} = require("../models");

exports.createProfile = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
        userName,
        businessType = "",
        address = "",
        geoLocation = [],
        profileType = "personal",
        bio = "",
        profession = "",
        skills = [],
        gender = "",
        amenities = [],
        } = req.body;

        const data = {};
        const userId = req.user; 

        switch (profileType) {
        case "personal":
            data.userName = userName;
            data.profession = profession;
            data.skills = Array.isArray(skills)
            ? skills
            : JSON.parse(skills || "[]");
            data.gender = gender;
            data.bio = bio;
            data.picture = req.file?.location || null;
            data.profileType = profileType;
            break;

        case "business":
            data.userName = userName;
            data.businessType = businessType;
            data.address = address;
            data.geoLocation = {
                type: "Point",
                coordinates: Array.isArray(geoLocation)
                ? geoLocation
                : JSON.parse(geoLocation || "[]")
            }
            data.bio = bio;
            data.picture = req.file?.location || null;
            data.profileType = profileType;
            break;

        default:
            await t.rollback();
            return res
            .status(400)
            .json({ message: "Invalid profile type selected!" });
        }

        
        const profile = await Profile.create(
            { userId, ...data },
            { transaction: t }
        );

        const parsedAmenities = Array.isArray(amenities)
                ? amenities
                : JSON.parse(amenities || "[]");

        if (profileType === "business" && Array.isArray(parsedAmenities) && parsedAmenities.length > 0) {
            const entries = parsedAmenities.map((name) => ({
                userId,
                businessId: profile.id, 
                name,
            }));

            await Amenity.bulkCreate(entries, {
                updateOnDuplicate: ["updatedAt"],
                transaction: t,
            });
        }

        await t.commit();

        const auth = {
            user: req.user,
            profile: profile ? { id: profile.id, type: profile.profileType } : null,
        };
        const token = jwtUtil.generateToken(auth);

        return res
        .status(200)
        .json({ profile, token, message: "Profile created successfully!" });
    } catch (error) {
        console.error("Profile creation failed:", error);
        await t.rollback();
        return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};

exports.addInterestsAndPlaces = async (req, res) => {
  try {
    const { interests = [], placesVisited = [] } = req.body;

      const [rowsUpdated] = await Profile.update(
          {
            interests: Array.isArray(interests)
                  ? interests
                  : JSON.parse(interests || "[]"), 
            placesVisited: Array.isArray(placesVisited)
                      ? placesVisited
                      : JSON.parse(placesVisited || "[]")
          },
          { where: { id: req.profile.id, userId: req.user } }
      );

    if (rowsUpdated === 0) {
      return res.status(400).json({ message: "Sorry no attached profile!" });
    }

    const profile = await Profile.findOne({
      where: { id: req.profile.id, userId: req.user },
    });

    res.status(200).json({
      profile,
      message: "Wow profile updated successfully!",
    });

  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Sorry interest & places places update failed" });
  }
};

exports.uploadDocument = async (req, res) => {
    try {
        const { documentType } = req.body;

        const document = await Document.create({
            profileId: req.profile.id,
            documentType: documentType,
            fileUrl: req.file.location || null,
            fileKey: req.file.key || null
        });
        
        res.status(200).json({document, message: "Document uploaded successfilly!"});
         
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.addOpeningHours = async (req, res) => {
    const t = await sequelize.transaction();
   try {
        const { hours } = req.body;

        if(!Array.isArray(hours)) return res.status(400).json({message: "Sorry hours not in right format"});

        await OpeningHour.destroy({ where: {businessId: req.profile.id} });

        const openingHours = await Promise.all( hours.map(async (hour)=>{
                const count = hours.length;
                if (count > 7) {
                    throw new Error("A business can only have up to 7 opening days");
                }
                return await OpeningHour.create({
                    businessId: req.profile.id,
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                },{ transaction: t });
            })
        );
        await t.commit();
        return res.status(200).json({openingHours, message: "Added opening hours successfilly!"});
         
    } catch (error) {
        console.log(error);
        await t.rollback();
        res.status(400).json({message: "Sorry something went wrong!"});
    } 
}

exports.addSocials = async (req, res) => {
    try {
        const { socials } = req.body;
        const profile = req.profile;
        const userId = req.user;

        const entries = Object.entries(socials).map(([platform, url]) => ({
            userId,
            profileId : profile.id,
            platform,
            url,
        }));

        const social = await Social.bulkCreate(entries, {
            updateOnDuplicate: ["url", "updatedAt"],
        });
        
        res.status(200).json({social , message: "Socials added successfilly!"});
         
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.addWifiDetails = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { name, password } = req.body;

    if (!name || !password) {
      await t.rollback();
      return res.status(400).json({ message: "WiFi name and password are required." });
    }
    
    const amenity = await Amenity.findOne({
      where: { businessId: req.profile.id, name: "wifi" },
      transaction: t
    });

    if (!amenity) {
      await t.rollback();
      return res.status(400).json({ message: "Sorry, WiFi amenity not found!" });
    }
    
    const wifiDetails = { name, password };
    
    amenity.meta = wifiDetails;

    await amenity.save({ transaction: t });
    await t.commit();

    return res.status(200).json({
      amenity,
      message: "WiFi details added successfully!",
    });
  } catch (error) {
    console.error("addWifiDetails error:", error);
    await t.rollback();
    return res.status(400).json({ message: "Sorry, something went wrong!" });
  }
}

exports.addRedeemRewardHours = async (req, res) => {
    const t = await sequelize.transaction();
    try {
            const { hours } = req.body;

            if(!Array.isArray(hours)) return res.status(400).json({message: "Sorry hours not in right format"});

            await RewardRedeemHour.destroy({ where: { businessId: req.profile.id } });

            const rewardRedeemHours = await Promise.all( hours.map(async (hour)=>{
                    const count = hours.length;
                    if (count > 7) {
                        throw new Error("A business can only have up to 7 opening days");
                    }
                    return await RewardRedeemHour.create({
                        businessId: req.profile.id,
                        dayOfWeek: hour.dayOfWeek,
                        openTime: hour.openTime,
                        closeTime: hour.closeTime,
                    },{ transaction: t });
                })
            );
            await t.commit();
            return res.status(200).json({rewardRedeemHours, message: "Added reward redeem hours successfilly!"});
            
        } catch (error) {
            await t.rollback();
            res.status(400).json({message: "Sorry something went wrong!"});
        } 
}

exports.updateProfile = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
        userName,
        businessType = "",
        address = "",
        bio,
        profession = "",
        skills = [],
        amenities = [],
        } = req.body;

        const userId = req.user;
        const selectedProfile = req.profile;

        const profile = await Profile.findOne({
            where: { id: selectedProfile.id, userId, profileType: selectedProfile.type },
            transaction: t,
        });

        if (!profile) {
        await t.rollback();
        return res.status(400).json({ message: "Sorry, can't locate profile!" });
        }

        
        switch (selectedProfile.type) {
            case "personal":
                profile.userName = userName || profile.userName;
                profile.profession = profession || profile.profession;
                profile.skills = skills
                ? Array.isArray(skills)
                    ? skills
                    : JSON.parse(skills || "[]")
                : profile.skills;
                profile.bio = bio || profile.bio;
                profile.picture = req.file?.location || profile.picture;
                profile.address = address || profile.address;
                break;

            case "business":
                profile.userName = userName || profile.userName;
                profile.businessType = businessType || profile.businessType;
                profile.address = address || profile.address;
                profile.bio = bio || profile.bio;
                profile.picture = req.file?.location || profile.picture;
                break;

            default:
                await t.rollback();
                return res.status(400).json({ message: "Invalid profile type!" });
        }

        await profile.save({ transaction: t });


        const parsedAmenities = Array.isArray(amenities)
                ? amenities
                : JSON.parse(amenities || "[]");

        if (selectedProfile.type === "business" && Array.isArray(parsedAmenities) && parsedAmenities.length > 0) {
            const entries = parsedAmenities.map((name) => ({
                userId,
                businessId: profile.id, 
                name,
            }));

            await Amenity.bulkCreate(entries, {
                updateOnDuplicate: ["updatedAt", "url"],
                transaction: t,
            });
        }

        await t.commit();

        return res.status(200).json({ profile, message: "Profile updated successfully!" });
    } catch (error) {
        console.log(error);
        await t.rollback();
        return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};

exports.fetchProfile = async (req, res ) => {
    try {
        const user = req.user;
        const selectedProfile = req.profile;

        const includes = [];

        switch (selectedProfile.type) {
            case "personal":
                includes.push({
                    model: User,
                    as: "user",
                    attributes: ["id", "email", "firstName", "lastName"],
                });
                includes.push({
                    model: Post,
                    as: "reviews",
                    where: {
                        postType: "review",
                    },
                    required: false,
                },);
                includes.push({
                    model: Post,
                    as: "posts",
                    where: {
                        postType: "normal",
                    },
                    required: false,
                },);
                break;

            case "business":
                includes.push({
                    model: User,
                    as: "user",
                    attributes: ["id", "email", "firstName", "lastName"],
                });
                includes.push({
                    model: Amenity,
                    as: "amenities",
                });
                includes.push({
                    model: Social,
                    as: "socials",
                });
                includes.push({
                    model: Post,
                    as: "posts",
                    where: {
                        postType: "normal",
                    },
                    required: false,
                },);
                break;

            default:
                return res.status(400).json({message:"Sorry select a profile!"});
                break;
        }

        const profile = await Profile.findOne({
            where: { id: selectedProfile.id, userId: user },
            include: includes,
        });

        profile["recentVisits"] = [];

        res.status(200).json({ profile, message:"Profile fetched flushed!"});

    } catch (error) {
        console.log(error);
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}



