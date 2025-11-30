const bcrypt = require("bcryptjs");
const jwtUtil = require("../utils/jwtUtil");
const { Op } = require("sequelize");
const Helpers = require("../utils/helpers");
const Email = require("../services/Email");
const Template = require("../constants/templates");
const {
  User,
  Profile,
  Branch,
  sequelize
} = require("../models");

exports.register = async (req, res)=> {
  const t = await sequelize.transaction();
  try {
    const {
      email,
      password,
      pushToken,
      phone_number,
      firstName,
      lastName,
      referralCode = null,
    } = req.body;

    const isExist = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { phone_number: phone_number }
        ]
      }
    });

    if (isExist) {
      await t.rollback();
      return res.status(400).json({message: "Email or phone number exist already!"});
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const code = Helpers.randomCharacters(6);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone_number,
      password: hashedPassword,
      pushToken: pushToken || null,
      referralCode: `OTG-${Helpers.randomCharacters(6)}`,
      verificationCode: bcrypt.hashSync(code, 10),
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000)
    }, { transaction: t });

    
    if (referralCode) {
      const referrerUser = await User.findOne({ where: { referralCode } });
      if (referrerUser) {
        
          await referrerUser.update(
            {
              successfulReferrals:
                (referrerUser.successfulReferrals || 0) + 1,
            },
            { transaction: t }
          );
          await Referral.create(
            { referrerId: referrerUser.id, refereeId: user.id },
            { transaction: t }
          );
      }
    }
    

    const options = {
      html: Template.verificationCode(code),
      text: "",
      to: email,
      subject: "Email Verification Code",
      cc: [],
      bcc: [],
      attachments: []
    };
    
    await Email.sendEmail(options);
    await t.commit();
    return res.status(201).json({
      message: "User registered successfully",
      user
    });
    
  } catch (error) {
    await t.rollback();
    return res.status(500).json({ log: error, message: "Sorry something went wrong!"});
  }
}

exports.login = async (req, res) => {
  
  try {
    const {
      email,
      password,
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({message: "Sorry email does not exist !"});
    }

    const isPassword = await bcrypt.compare(password, user.password);

    if(!isPassword){
      return res.status(400).json({message: "Sorry check password!"});
    }
    const profile = await Profile.findOne({
      where: { userId: user.id }
    });

    const branch = await Branch.findOne({
      where: {
        profileId: profile.id,
        isHQ: true
      }
    });

    const auth = { 
      user: user.id, 
      profile: profile ? { id: profile.id, type: profile.profileType } : null,
      branch: branch ? branch.id  : null
    };
    
    const token = jwtUtil.generateToken(auth);
    
    return res.status(200).json({
      message: "User authenticated successfully",
      user,
      profile,
      token
    });
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Sorry something went wrong!"});
  }
}

exports.verifyEmail = async (req, res) => {
  try {
    const {
      email,
      code,
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({message: "Sorry email does not exist !"});
    }

    const isCode = await bcrypt.compare(code, user.verificationCode);
    const isExpired = (new Date() > user.verificationExpires);

    if(!isCode || isExpired){
      return res.status(400).json({message: "Sorry check code might be expired or incorrect!"});
    }

    user.isVerified = true;
    await user.save();
    const auth = { user: user.id, profile: null }
    return res.status(200).json({
      token: jwtUtil.generateToken(auth),
      message: "User email verified successfully",
    });
    
  } catch (error) {
    return res.status(500).json({ message: "Sorry something went wrong!"});
  }
}

exports.sendCode = async (req, res) => {
  try {
    const {
      email,
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({message: "Sorry email does not exist !"});
    }

    const code = Helpers.randomCharacters(6);

    user.verificationCode = bcrypt.hashSync(code, 10); 
    user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const options = {
      html: Template.verificationCode(code),
      text: "",
      to: email,
      subject: "Email Verification Code",
      cc: [],
      bcc: [],
      attachments: []
    };

    await Email.sendEmail(options);
    
    
    return res.status(200).json({ message: "Verification code sent successfully" });
    
  } catch (error) {
    return res.status(500).json({ message: "Sorry something went wrong!"});
  }
}

exports.resetPassword = async (req, res)=>{
  try {
    const {
      email,
      code,
      password
    } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({message: "Sorry email does not exist !"});
    }

    const isCode = await bcrypt.compare(code, user.verificationCode);
    const isExpired = (new Date() > user.verificationExpires);

    if(!isCode || isExpired){
      return res.status(400).json({message: "Sorry check code might be expired or incorrect!"});
    }

    user.password = bcrypt.hashSync(password, 10);
    await user.save();
    
    return res.status(200).json({
      message: "User email verified successfully",
    });
    
  } catch (error) {
    return res.status(500).json({ message: "Sorry something went wrong!"});
  }
}


