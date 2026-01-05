import db from "../models";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { randomCharacters } from "../utils/helpers";
import { sendEmail } from "../services/email.service";
import { verificationCodeEmail } from "../templates/verificationEmail";
import * as jwtUtil from "../utils/jwtUtil";
import { BranchStaff } from "../models/BranchStaff";

const { User, Profile, Referral, Branch, sequelize } = db;

export class AuthService {
    static async register(data: any) {
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
            } = data;

            const isExist = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: email },
                        { phone_number: phone_number }
                    ]
                },
                transaction: t // added transaction for safety although findOne reads
            });

            if (isExist) {
                await t.rollback();
                // using error message to propagate to controller
                throw new Error("Email or phone number exist already!");
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            const code = randomCharacters(6);

            const user = await User.create({
                firstName,
                lastName,
                email,
                phone_number,
                password: hashedPassword,
                pushToken: pushToken || null,
                referralCode: `OTG-${randomCharacters(6)}`,
                verificationCode: bcrypt.hashSync(code, 10),
                verificationExpires: new Date(Date.now() + 15 * 60 * 1000)
            }, { transaction: t });


            if (referralCode) {
                const referrerUser = await User.findOne({ where: { referralCode }, transaction: t });
                if (referrerUser) {
                    await referrerUser.update(
                        {
                            successfulReferrals: (referrerUser.successfulReferrals || 0) + 1,
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
                html: verificationCodeEmail(code),
                text: "",
                to: email,
                subject: "Email Verification Code",
                cc: [],
                bcc: [],
                attachments: []
            };

            await sendEmail(options);
            await t.commit();

            const userPlain = user.toJSON();
            delete userPlain.password;
            delete userPlain.verificationCode;

            return userPlain;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async login(data: any) {
        const { email, password } = data;

        if (!User) {
            throw new Error("Internal Server Error: DB Misconfiguration");
        }

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            throw new Error("Email does not exist!");
        }

        const isPassword = await bcrypt.compare(password, user.password);

        if (!isPassword) {
            throw new Error("Sorry check password!");
        }

        const profile = await Profile.findOne({
            where: { userId: user.id }
        });

        let branch = null;
        if (profile) {
            branch = await Branch.findOne({
                where: {
                    profileId: profile.id,
                    isHQ: true
                }
            });
        }

        const auth = {
            user: user.id,
            profile: profile ? { id: profile.id, type: profile.profileType } : null,
            branch: branch ? branch.id : null
        };

        const token = jwtUtil.generateToken(auth);

        return { user, profile, token };
    }

    static async verifyEmail(data: any) {
        const { email, code } = data;

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            throw new Error("Sorry email does not exist !");
        }

        if (!user.verificationCode) {
            throw new Error("Invalid code");
        }

        const isCode = await bcrypt.compare(code, user.verificationCode);
        const isExpired = user.verificationExpires ? (new Date() > user.verificationExpires) : false;

        if (!isCode) {
            throw new Error("Invalid code");
        }

        if (isExpired) {
            throw new Error("Expired code");
        }

        user.isVerified = true;
        await user.save();

        const auth = { user: user.id, profile: null, branch: null };
        const token = jwtUtil.generateToken(auth);

        return { token };
    }

    static async sendCode(email: string) {
        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            throw new Error("Email does not exist !");
        }

        const code = randomCharacters(6);

        user.verificationCode = bcrypt.hashSync(code, 10);
        user.verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const options = {
            html: verificationCodeEmail(code),
            text: "",
            to: email,
            subject: "Email Verification Code",
            cc: [],
            bcc: [],
            attachments: []
        };

        await sendEmail(options);
        return true;
    }

    static async resetPassword(data: any) {
        const { email, code, password } = data;

        const user = await User.findOne({
            where: { email },
        });

        if (!user) {
            throw new Error("User not found!");
        }

        if (!user.verificationCode) {
            throw new Error("Invalid code");
        }

        const isCode = await bcrypt.compare(code, user.verificationCode);
        const isExpired = user.verificationExpires ? (new Date() > user.verificationExpires) : false;

        if (!isCode) {
            throw new Error("Invalid code");
        }

        if (isExpired) {
            throw new Error("Expired code");
        }

        user.password = bcrypt.hashSync(password, 10);
        await user.save();

        return true;
    }

    static async completeInvite(data: any) {
        const t = await sequelize.transaction();
        try {
            const { token, password, firstName, lastName } = data;

            const decoded: any = jwtUtil.verifyToken(token);
            if (!decoded || !decoded.invite) {
                throw new Error("Invalid or expired invite token");
            }

            const { branch: branchId, invite: inviteInfo } = decoded;
            const { email, role, id } = inviteInfo;

            // 1. Check if user already exists
            let user = await User.findOne({ where: { email }, transaction: t });

            if (user) {
                // Verify their existing password
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    throw new Error("Invalid password. Please use your existing account password.");
                }

                // Check if they already have a profile
                let profile = await Profile.findOne({ where: { userId: user.id }, transaction: t });

                // Update the BranchStaff record
                const staff = await db.BranchStaff.findOne({
                    where: { id: inviteInfo.id, email },
                    transaction: t
                });

                if (!staff) {
                    throw new Error("Invite record not found");
                }

                // Check if already linked
                if (staff.userId && staff.userId === user.id) {
                    throw new Error("You have already accepted this invitation");
                }

                await staff.update({
                    userId: user.id,
                    isActive: true
                }, { transaction: t });

                await t.commit();

                const auth = {
                    user: user.id,
                    profile: profile ? { id: profile.id, type: profile.profileType } : null,
                    branch: branchId
                };
                const authToken = jwtUtil.generateToken(auth);

                return { user, profile, token: authToken };

            } else {
                // New user - create account
                const hashedPassword = bcrypt.hashSync(password, 10);
                user = await User.create({
                    firstName,
                    lastName,
                    email,
                    phone_number: '1234567890',
                    password: hashedPassword,
                    isVerified: true, // Email is verified via the invite link
                    referralCode: `OTG-${randomCharacters(6)}`,
                }, { transaction: t });
            }

            // 2. Create Profile if not exists
            let profile = await Profile.findOne({ where: { userId: user.id }, transaction: t });
            if (!profile) {
                profile = await Profile.create({
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userName: user.email.split('@')[0] + randomCharacters(4),
                    profileType: 'personal', // Default to personal, they can change or add business later
                    isActivated: true
                }, { transaction: t });
            }

            const staff = await BranchStaff.findOne({
                where: { id: inviteInfo.id, email },
                transaction: t
            });

            if (!staff) {
                throw new Error("Invite record not found");
            }

            await staff.update({
                userId: user.id,
                isActive: true
            }, { transaction: t });

            await t.commit();

            const auth = {
                user: user.id,
                profile: { id: profile.id, type: profile.profileType },
                branch: branchId
            };
            const authToken = jwtUtil.generateToken(auth);

            return { user, profile, token: authToken };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}
