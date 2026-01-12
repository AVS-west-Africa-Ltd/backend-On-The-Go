import db from "../models";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { randomCharacters } from "../utils/helpers";
import { sendEmail } from "../services/email.service";
import { verificationCodeEmail } from "../templates/verificationEmail";
import * as jwtUtil from "../utils/jwtUtil";
import { BranchStaff } from "../models/BranchStaff";
import { ProfileType } from "../models/types/profile.types";
import { User } from "../models/User";
import { Branch } from "../models/Branch";
import { Profile } from "../models/Profile";
import { AdminPermission, AdminRole } from "../models/types/admin.types";
import { Admin } from "../models/Admin";

const { sequelize } = db;

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
                    // await Referral.create(
                    //     { referrerId: referrerUser.id, refereeId: user.id },
                    //     { transaction: t }
                    // );
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

            const { password: _password, verificationCode: _verificationCode, ...userPlain } = user.toJSON();
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
            const { token, password, firstName, lastName, phoneNumber } = data;

            const decoded: any = jwtUtil.verifyToken(token);
            if (!decoded || !decoded.invite) {
                throw new Error("Invalid invite");
            }

            const { branch: branchId, invite: inviteInfo } = decoded;
            const { email, role, id } = inviteInfo;

            const staff = await BranchStaff.findOne({
                where: { id: inviteInfo.id, email },
                transaction: t
            });

            if (!staff) {
                throw new Error("Invite record not found");
            }
            if (staff.userId) throw new Error("Invite already used");
            if (staff.branchId !== branchId) throw new Error("Invite mismatch");

            let user = await User.findOne({ where: { email }, transaction: t });

            if (user) {
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    throw new Error("Invalid password. Please use your existing account password.");
                }

                // Check if they already have a profile
                // let profile = await Profile.findOne({ where: { userId: user.id }, transaction: t });

                // if (!profile) {
                //     profile = await Profile.create({
                //         userId: user.id,
                //         userName: user.email.split('@')[0] + randomCharacters(4),
                //         profileType: ProfileType.PERSONAL,
                //     }, { transaction: t });
                // }

                // Check if already linked
                if (staff.userId && staff.userId === user.id) {
                    throw new Error("You have already accepted this invitation");
                }

                await staff.update({
                    userId: user.id,
                    isActive: true
                }, { transaction: t });

                // await t.commit();

            } else {
                // New user - create account
                const hashedPassword = await bcrypt.hash(password, 10);
                user = await User.create({
                    firstName,
                    lastName,
                    email,
                    phone_number: phoneNumber,
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
                    userName: user.email.split('@')[0] + randomCharacters(4),
                    profileType: ProfileType.PERSONAL,
                }, { transaction: t });
            }
            // }

            await staff.update({
                userId: user.id,
                isActive: true
            }, { transaction: t });

            await Admin.create({
                branchId: branchId,
                role: AdminRole.ADMIN,
                userId: user.id,
                profileId: profile.id,
                name: `${firstName} ${lastName}`,
                email: email,
                branchStaffId: staff.id,
                permissions: [AdminPermission.MANAGE_PRODUCTS, AdminPermission.MANAGE_ORDERS, AdminPermission.MANAGE_BRANCH, AdminPermission.MANAGE_AMENITIES, AdminPermission.MANAGE_COMMUNITY],
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
    static async checkUsername(username: string) {
        const user = await Profile.findOne({ where: { userName: username } });
        return !user;
    }

    static async checkEmail(email: string) {
        const user = await User.findOne({ where: { email } });
        return !user;
    }

    static async changePassword(userId: number, oldPass: string, newPass: string) {
        if (!userId) throw new Error("User ID is required");

        const user = await User.findByPk(userId);
        if (!user) throw new Error("User not found");

        const isValid = await bcrypt.compare(oldPass, user.password);
        if (!isValid) throw new Error("Old password is incorrect");

        user.password = await bcrypt.hash(newPass, 10);
        await user.save();
        return true;
    }
}
