const jwtUtil = require("../utils/jwtUtil");

const {
  Amenity,
  Profile,
  sequelize,
  Document,
  OpeningHour,
  RewardRedeemHour
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
        bio,
        profession = "",
        skills = [],
        gender = "",
        amenities = []
        } = req.body;

        const data = {};

        switch (profileType) {
        case "personal":
            data.userName = userName;
            data.profession = profession;
            data.skills = Array.isArray(skills)
            ? skills
            : JSON.parse(skills || []);
            data.gender = gender;
            data.bio = bio;
            data.picture = req.file?.location || null; 
            data.profileType = profileType;
            break;

        case "business":
            data.userName = userName;
            data.businessType = businessType;
            data.address = address;
            data.geoLocation = Array.isArray(geoLocation)
            ? geoLocation
            : JSON.parse(geoLocation || []);
            data.bio = bio;
            data.picture = req.file?.location || null;
            data.profileType = profileType;
            break;

        default:
            await t.rollback();
            return res.status(400).json({ message: "Sorry no profile type was selected!" });
        }

        const profile = await Profile.create({ userId: req.user, ...data }, { transaction: t });

        if(profileType == "business"){
            const amenityLists = Array.isArray(amenities)
            ? amenities
            : JSON.parse(amenities || []);

            await Amenity.bulkCreate(
                amenityLists.map(a => ({
                    businessId: profile.id,
                    name: a,
                    rating: 0,
                })),
                { transaction: t }
            );

        }
        await t.commit();
        const auth = { user: req.user, profile: profile ? { id: profile.id, type: profile.profileType } : null }
        const token = jwtUtil.generateToken(auth);

        return res.status(200).json({ profile, token, message: "Profile created successfully!" });
    } catch (error) {
        console.error(error);
        await t.rollback();
        res.status(400).json({ message: "Sorry something went wrong!" });
    }
};

exports.addInterestsAndPlaces = async (req, res) => {
    try {
        const {interests = [], placesVisited = []} = req.body;
        const profile = await Profile.update(
            { interests: interests, placesVisited: placesVisited },
            { 
                where: { id:req.profile.id },
                returning: true, 
                plain: false 
            }
        );

        res.status(200).json({profile, message: "Profile updated successfilly!"});
         
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

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
        const profile = await Profile.update(
            { socialLinks: socials },
            { where: { id:req.profile.id }, returning: true, }
        );
        
        res.status(200).json({profile, message: "Socials added successfilly!"});
         
    } catch (error) {
        console.log(error);
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.addWifiDetails = async (req, res) => {
    try {
        const { name, password } = req.body;
        const wifi = { name, password };

        const amenity = await Amenity.findOne({ where: {businessId: req.profile.id, name: "wifi" } });
        if(!amenity) return res.status(400).json({message: "Sorry wifi amenity not found!"});
        
        amenity.meta = wifi;
        await amenity.save();
        
        res.status(200).json({amenity, message: "Wifi Details added successfilly!"});
         
    } catch (error) {

        res.status(400).json({message: "Sorry something went wrong!"});
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



