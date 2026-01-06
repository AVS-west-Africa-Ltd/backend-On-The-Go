import { appEvents } from '../utils/events';
import { STAFF_EVENT } from '../subscribers/types';
import { sendEmail } from '../services/email.service';
import { staffInviteEmail } from '../templates/staffInviteEmail';

export const registerStaffListeners = () => {
    appEvents.on(STAFF_EVENT.STAFF_INVITED, async (data: {
        fullName: string;
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
                    fullName: data.fullName,
                    branchName: data.branchName,
                    role: data.role,
                    inviteLink: data.inviteLink
                }),
                text: `Hello ${data.fullName}, you have been invited to join ${data.branchName} as ${data.role}. Visit ${data.inviteLink} to complete registration.`
            });

            if (!result.success) {
                console.error(`❌ Failed to send staff invitation email to ${data.email}`);
            }
            console.log(`✅ Staff invitation email sent successfully to ${data.email}`);
        } catch (error) {
            console.error("Background Staff Invitation Error:", error);
        }
    });
};
