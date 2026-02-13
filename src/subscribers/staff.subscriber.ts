import { appEvents } from '../utils/events';
import { STAFF_EVENT } from '../subscribers/types';
import { sendEmail } from '../services/email.service';
import { staffInviteEmail } from '../templates/staffInviteEmail';
import { Admin } from '../models/admin.model';
import { AdminPermission, AdminRole } from '../models/types/admin.types';
import bcrypt from "bcryptjs"
import { User } from '../models/user.model';
import { randomCharacters, randomNumber } from '../utils/helpers';
import { Profile } from '../models/profile.model';
import { ProfileType } from '../models/types/profile.types';
import { BranchStaff } from '../models/branchStaff.model';

export const registerStaffListeners = () => {
    appEvents.on(STAFF_EVENT.STAFF_INVITED, async (data: {
        firstName: string;
        lastName: string;
        email: string;
        branchName: string;
        role: string;
        inviteLink: string;
    }) => {
        try {
            console.log(`Sending staff invitation email to ${data.email}...`);

            const result = await sendEmail({
                to: data.email,
                subject: `You're Invited to Join ${data.branchName} on OnTheGo`,
                html: staffInviteEmail({
                    fullName: `${data.firstName} ${data.lastName}`,
                    branchName: data.branchName,
                    role: data.role,
                    inviteLink: data.inviteLink
                }),
                text: `Hello ${data.firstName}, you have been invited to join ${data.branchName} as ${data.role}. Visit ${data.inviteLink} to complete registration.`
            });

            if (!result.success) {
                console.error(`❌ Failed to send staff invitation email to ${data.email}`);
            }
            console.log(`✅ Staff invitation email sent successfully to ${data.email}`);
        } catch (error) {
            console.error("Background Staff Invitation Error:", error);
        }
    });

    appEvents.on(STAFF_EVENT.STAFF_AUTO_ACCEPT, async (data: {
        firstName: string;
        lastName: string;
        email: string;
        branchId: number;
        branchStaffId: string;
    }) => {
        try {
            console.log(`🚀 Auto-accepting staff invite for ${data.email}...`);

            // const { User } = require('../models/User');
            // const { Profile } = require('../models/Profile');
            // const { BranchStaff } = require('../models/BranchStaff');
            // const { ProfileType } = require('../models/types/profile.types');
            // const { randomCharacters, randomNumber } = require('../utils/helpers');
            // const bcrypt = require('bcryptjs');

            const hashedPassword = await bcrypt.hash("password123", 10);

            // 1. Find or create User
            let user = await User.findOne({ where: { email: data.email } });
            if (!user) {
                user = await User.create({
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone_number: randomNumber(11),
                    password: hashedPassword,
                    isVerified: true,
                    referralCode: `OTG-${randomCharacters(6)}`,
                });
                console.log(`   ✅ User created: ${data.email}`);
            }

            // 2. Find or create Profile
            let profile = await Profile.findOne({ where: { userId: user.id } });
            if (!profile) {
                profile = await Profile.create({
                    userId: user.id,
                    userName: user.email.split('@')[0] + randomCharacters(4),
                    profileType: ProfileType.PERSONAL,
                });
                console.log(`   ✅ Profile created for: ${data.email}`);
            }

            // 3. Activate Staff Record
            const staff = await BranchStaff.findByPk(data.branchStaffId);
            if (staff) {
                await staff.update({
                    userId: user.id,
                    isActive: true
                });
                console.log(`   ✅ Staff record activated: ${data.email}`);
            }

            // 4. Create Admin record
            const existingAdmin = await Admin.findOne({ where: { email: data.email, branchId: data.branchId } });
            if (!existingAdmin) {
                await Admin.create({
                    branchId: data.branchId,
                    role: AdminRole.ADMIN,
                    userId: user.id,
                    profileId: profile.id,
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    branchStaffId: data.branchStaffId,
                    password: hashedPassword,
                    permissions: [
                        AdminPermission.MANAGE_PRODUCTS,
                        AdminPermission.MANAGE_ORDERS,
                        AdminPermission.MANAGE_BRANCH,
                        AdminPermission.VIEW_INSIGHTS,
                        AdminPermission.MANAGE_AMENITIES,
                        AdminPermission.MANAGE_COMMUNITY
                    ],
                });
                console.log(`✅ Admin record created: ${data.email}`);
            }

        } catch (error) {
            console.error("Background Staff Auto-Accept Error:", error);
        }
    });
};
