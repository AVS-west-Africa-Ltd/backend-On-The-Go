const jwtUtil = require("../utils/jwtUtil");

const {
  Amenity,
  Profile,
  sequelize,
  Document,
  OpeningHour,
  User,
  Social,
  Post,
  Media,
  Branch
} = require("../models");

const Helpers = require("../utils/helpers");

exports.createProfile = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
        userName,
        streetAddress = "",
        fullAddress = "",
        state = "",
        city = "",
        country = "",
        geoLocation = [],
        profileType = "personal",
        bio = "",
        profession = "",
        skills = [],
        gender = "",
        amenities = [],
        cacNo,
        interests = [], 
        placesVisited = [],
        occupation = "",
        businessCategory = ""
        } = req.body;

        const data = {};
        const branch = {};
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
            data.interests = Array.isArray(interests)
                  ? interests
                  : JSON.parse(interests || "[]"), 
            data.placesVisited = Array.isArray(placesVisited)
                      ? placesVisited
                      : JSON.parse(placesVisited || "[]"),
            data.occupation = occupation
            break;

        case "business":
            if(state.trim() == "" || country.trim() == "" || city.trim() == "" || streetAddress.trim() == "" || cacNo.trim() == ""){
                return res.status(400).json({message: "Sorry state, country, city, street address CAC number are all required!"});
            }

            data.userName = userName;
            data.streetAddress = streetAddress;
            data.state = state;
            data.country = country;
            data.city = city;
            const parsedLocation = Helpers.validateGeolocation(geoLocation);
            if(parsedLocation.length == 2){
              data.geoLocation ={
                type: "Point",
                coordinates: parsedLocation
              };
            }
            data.cacNo = cacNo;
            data.picture = req.file?.location || null;
            data.profileType = profileType;
            data.businessCategory = businessCategory;

            branch.name = `${data.userName} ( HQ ${data.state} ${data.city} )`;
            branch.streetAddress = data.streetAddress;
            branch.state = data.state;
            branch.country = data.country;
            branch.city = data.city;
            branch.geoLocation = data.geoLocation;
            branch.isHQ = true;
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
        branch.profileId = profile.id;
        await Branch.create(
          {...branch},
          {transaction: t}
        );

        await t.commit();

        const auth = {
            user: req.user,
            profile: profile ? { id: profile.id, type: profile.profileType } : null,
            branch: branch.id
        };

        const token = jwtUtil.generateToken(auth);

        return res
        .status(200)
        .json({ profile, token, message: "Profile created successfully!" });

    } catch (error) {
        console.error("Profile creation failed:", error);
        await t.rollback()
        return res.status(400).json({ message: "Sorry, something went wrong!" });
    }
};

exports.addMoreInfomation = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { bio, businessType, website } = req.body;
    const profileId = req.profile.id;
    const userId = req.user;

    const profile = await Profile.findOne({
      where: { userId, id: profileId, profileType: "business"},
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!profile) {
      await t.rollback();
      return res.status(400).json({ message: "Sorry profile not in record!" });
    }

    await profile.update(
      { bio, businessType, website },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({ message: "Perfect more information added!" });

  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: "Sorry adding more information failed!" });
  }
};

exports.addInterestsAndPlaces = async (req, res) => {
  try {
    const profileId = req.profile.id;
    const userId = req.user;

    let { interests = [], placesVisited = [] } = req.body;

    if (!Array.isArray(interests)) {
      try { interests = JSON.parse(interests); } catch { interests = []; }
    }

    if (!Array.isArray(placesVisited)) {
      try { placesVisited = JSON.parse(placesVisited); } catch { placesVisited = []; }
    }

    const [updated] = await Profile.update(
      { interests, placesVisited },
      { where: { id: profileId, userId } }
    );

    if (updated === 0) {
      return res.status(400).json({ message: "Sorry no attached profile!" });
    }

    const profile = await Profile.findOne({
      where: { id: profileId, userId }
    });

    return res.status(200).json({
      profile,
      message: "Wow profile updated successfully!"
    });

  } catch (error) {
    return res.status(400).json({
      message: "Sorry interest & places update failed"
    });
  }
};

exports.uploadDocument = async (req, res) => {
    try {
        const { documentType } = req.body;

        const document = await Document.create({
            profileId: req.profile.id,
            documentType: documentType,
            fileUrl: req.file?.location || null,
            fileKey: req.file?.key || null
        });
        
        res.status(200).json({document, message: "Document uploaded successfilly!"});
         
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "Sorry something went wrong!"});
    }
};

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
};

exports.addAmenities = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amenities } = req.body;
    const profileId = req.profile.id;
    const branchId = req.branch
    const userId = req.user;

    const branch = await Branch.findOne({
      where: { id: branchId, profileId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!branch) {
      await t.rollback();
      return res.status(400).json({ message: "Sorry branch not in record!" });
    }

    let parsedAmenities = amenities;

    if (!Array.isArray(parsedAmenities)) {
      try {
        parsedAmenities = JSON.parse(parsedAmenities || "[]");
      } catch {
        parsedAmenities = [];
      }
    }

    if (parsedAmenities.length > 0) {
      const rows = parsedAmenities.map(name => ({
        userId,
        businessId: profileId,
        branchId, 
        name
      }));

      await Amenity.bulkCreate(rows, {
        updateOnDuplicate: ["updatedAt"],
        transaction: t
      });
    }

    await t.commit();

    return res.status(200).json({
      message: "Amenities added successfully!"
    });

  } catch (error) {
    console.log(error);
    await t.rollback();
    return res.status(400).json({
      message: "Sorry adding amenities failed!"
    });
  }
};

exports.addPhotos = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { targetType, targetId } = req.body;
    const files = req.files;
    const userId = req.user;

    
    if (!targetType || !targetId) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Target type and target ID are required"
      });
    }

    if (!files || files.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "No files uploaded"
      });
    }

    
    const validTargetTypes = ['profile', 'post'];
    if (!validTargetTypes.includes(targetType)) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Invalid target type. Must be one of: ${validTargetTypes.join(', ')}`
      });
    }

    
    const mediaEntries = files.map((file, index) => ({
      targetId: parseInt(targetId),
      targetType,
      userId,
      filePath: file.location,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      metadata: {
        s3Key: file.key,
        bucket: file.bucket,
        etag: file.etag,
        storageClass: file.storageClass,
        contentDisposition: file.contentDisposition,
      },
      uploadOrder: index,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    console.log(mediaEntries);
    
    const createdMedia = await Media.bulkCreate(mediaEntries, {
      transaction,
      returning: true,
      validate: true
    });

    await transaction.commit();

    return res.status(201).json({
      createdMedia,
      message: `Successfully uploaded ${createdMedia.length} photo(s)`,
    });

  } catch (error) {
    await transaction.rollback();
    
    console.error('Photo upload error:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed for uploaded files',
        errors: error.errors.map(err => err.message)
      });
    }

    return res.status(500).json({
      message: 'Sorry failed to upload photos',
    });
  }
};

exports.addSocials = async (req, res) => {
    try {
        const { socials = {} } = req.body;
        const { profile, user: userId } = req;

        if (!socials || Object.keys(socials).length === 0) {
            return res.status(400).json({ 
                message: "Socials data is required" 
            });
        }

        const socialEntries = Object.entries(socials).map(([platform, url]) => ({
            userId,
            profileId: profile.id,
            platform: platform.toLowerCase().trim(),
            url: url.trim(),
        }));

        const createdSocials = await Social.bulkCreate(socialEntries, {
            updateOnDuplicate: ["url", "updatedAt"],
            returning: true,
        });

        return res.status(200).json({
            data: createdSocials,
            message: "Social media links updated successfully",
            count: createdSocials.length
        });
         
    } catch (error) {
        console.error("Error adding socials:", error);
        return res.status(500).json({
            message: "Failed to update social media links",
        });
    }
};

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
};

exports.addRedeemRewardHours = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { hours } = req.body;
        const { profile } = req;

        if (!Array.isArray(hours)) {
            return res.status(400).json({ 
                message: "Hours data must be provided as an array" 
            });
        }

        if (hours.length === 0) {
            return res.status(400).json({ 
                message: "At least one operating hour entry is required" 
            });
        }

        if (hours.length > 7) {
            return res.status(400).json({ 
                message: "Maximum 7 operating days allowed per business" 
            });
        }

        
        const validationErrors = [];
        const seenDays = new Set();

        hours.forEach((hour, index) => {
            if (!hour.dayOfWeek || hour.dayOfWeek < 0 || hour.dayOfWeek > 6) {
                validationErrors.push(`Entry ${index + 1}: dayOfWeek must be between 0-6`);
            }
            
            if (seenDays.has(hour.dayOfWeek)) {
                validationErrors.push(`Entry ${index + 1}: duplicate dayOfWeek ${hour.dayOfWeek}`);
            }
            seenDays.add(hour.dayOfWeek);

            if (!hour.openTime || !hour.closeTime) {
                validationErrors.push(`Entry ${index + 1}: openTime and closeTime are required`);
            }
        });

        if (validationErrors.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                message: "Sorry invalid hours data provided",
            });
        }

        
        await RewardRedeemHour.destroy({ 
            where: { businessId: profile.id },
            transaction 
        });

        const rewardRedeemHours = await RewardRedeemHour.bulkCreate(
            hours.map(hour => ({
                businessId: profile.id,
                dayOfWeek: hour.dayOfWeek,
                openTime: hour.openTime,
                closeTime: hour.closeTime,
            })),
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            data: rewardRedeemHours,
            message: "Reward redeem hours updated successfully",
        });
            
    } catch (error) {
        await transaction.rollback();
        
        console.error("Error updating reward redeem hours:", error);
        
        return res.status(400).json({
            message: "Failed to update reward redeem hours",
        });
    }
};

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
};



