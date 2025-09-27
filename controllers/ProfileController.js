const { Op } = require("sequelize");
const Helpers = require("../utils/helpers");
const Email = require("../services/Email");
const Template = require("../constants/templates");
const {
  User,
  Profile,
  sequelize,
  Document,
  OpeningHour,
  RewardRedeemHour
} = require("../models");


exports.createProfile = async (req, res) => {
    try {
        const {
            userName,
            businessType = "",
            address = "",
            geoLocation = {},
            picture,
            profileType = "personal",
            bio,
            profession = "",
            skills = [],
            gender = "",

        } = req.body;

        const data = {};

        switch (profileType) {
            case "personal":
                data.userName = userName;
                data.profession = profession;
                data.skills = skills;
                data.gender = gender;
                data.bio = bio;
                data.picture = req.file.location;
                break;
            
            case "business":
                data.userName = userName;
                data.businesType = businessType;
                data.address = address;
                data.geoLocation = geoLocation;
                data.bio = bio;
                data.picture = req.file.location;
                break;
        
            default:
                return res.status(400).json({message: "Sorry no profile type was selected!"});
                break;
        }

        const profile = await Profile.create({userId:req.user.id, ...data });

        return res.status(200).json({ profile, message: "Profile created successfully!"});

    } catch (error) {
        res.status(400).json({message: "Sorry something went wrong!"});
    }
    




}

exports.addInterestsAndPlaces = async (req, res) => {
    try {
        const {profileId, interests = [], placesVisited = []} = req.body;
        const profile = await Profile.findOne({ 
            where: { id: profileId, userId: req.user.id } 
        });

        if(!profile) res.status(400).json({ message: "Sorry profile not found!"});

        profile.interests = interests;
        profile.placesVisited = placesVisited;
        await profile.save(); 
        res.status(200).json({profile, message: "Profile updated successfilly!"});
         
    } catch (error) {
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.uploadDocument = async (req, res) => {
    try {
        const {profileId} = req.body;
        const profile = await Profile.findOne({ 
            where: { id: profileId, userId: req.user.id } 
        });
        if(!profile) return res.status(400).json({ message: "Sorry profile not found!"});

        if(!req.file) return res.status(400).json({message: "Sorry no document was selected"});

        const document = Document.create({
            profileId: profileId,
            documentType: "cac",
            fileUrl: req.file.location,
            fileKey: req.file.key
        });
        
        res.status(200).json({document, message: "Document uploaded successfilly!"});
         
    } catch (error) {
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.addOpeningHours = async (req, res) => {
    const t = await sequelize.transaction();
   try {
        const {profileId, hours} = req.body;
        const profile = await Profile.findOne({ 
            where: { id: profileId, userId: req.user.id } 
        });
        if(!profile) return res.status(400).json({ message: "Sorry profile not found!"});

        if(!Array.isArray(hours)) return res.status(400).json({message: "Sorry hours not in right format"});

        await OpeningHour.destroy({ where: {businessId: profileId} });

        const openingHours = await Promise.all( hours.map(async (hour)=>{
                const count = await OpeningHour.count({ where: { businessId: profile.id } });
                if (count >= 7) {
                    throw new Error("A business can only have up to 7 opening days");
                }
                return await OpeningHour.create({
                    businessId: profile.id,
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                },{ transaction: t });
            })
        );
        await t.commit();
        return res.status(200).json({openingHours, message: "Document uploaded successfilly!"});
         
    } catch (error) {
        await t.rollback();
        res.status(400).json({message: "Sorry something went wrong!"});
    } 
}

exports.addSocials = async (req, res) => {
    try {
        const {profileId, socials} = req.body;
        const profile = await Profile.findOne({ 
            where: { id: profileId, userId: req.user.id } 
        });
        if(!profile) return res.status(400).json({ message: "Sorry profile not found!"});

        profile.socialsLinks = socials;
        profile.save();
        
        res.status(200).json({document, message: "Socials added successfilly!"});
         
    } catch (error) {
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.addWifiDetails = async (req, res) => {
    try {
        const {profileId, ssID, password} = req.body;
        const profile = await Profile.findOne({ 
            where: { id: profileId, userId: req.user.id } 
        });
        if(!profile) return res.status(400).json({ message: "Sorry profile not found!"});
        const wifi = { ssID, password}
        profile.wifiDetails = wifi;
        profile.save();
        
        res.status(200).json({document, message: "Wifi Details added successfilly!"});
         
    } catch (error) {
        res.status(400).json({message: "Sorry something went wrong!"});
    }
}

exports.addRedeemRewardHours = async (req, res) => {
    const t = await sequelize.transaction();
   try {
        const {profileId, hours} = req.body;
        const profile = await Profile.findOne({ 
            where: { id: profileId, userId: req.user.id } 
        });
        if(!profile) return res.status(400).json({ message: "Sorry profile not found!"});

        if(!Array.isArray(hours)) return res.status(400).json({message: "Sorry hours not in right format"});

        await RewardRedeemHour.destroy({ where: {businessId: profileId} });

        const rewardRedeemHours = await Promise.all( hours.map(async (hour)=>{
                const count = await OpeningHour.count({ where: { businessId: profile.id } });
                if (count >= 7) {
                    throw new Error("A business can only have up to 7 opening days");
                }
                return await RewardRedeemHour.create({
                    businessId: profile.id,
                    dayOfWeek: hour.dayOfWeek,
                    openTime: hour.openTime,
                    closeTime: hour.closeTime,
                },{ transaction: t });
            })
        );
        await t.commit();
        return res.status(200).json({rewardRedeemHours, message: "Document uploaded successfilly!"});
         
    } catch (error) {
        await t.rollback();
        res.status(400).json({message: "Sorry something went wrong!"});
    } 
}



