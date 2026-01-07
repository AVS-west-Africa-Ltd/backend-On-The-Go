export const staffInviteEmail = (data: {
    fullName: string;
    branchName: string;
    role: string;
    inviteLink: string;
}) => {
    const { fullName, branchName, role, inviteLink } = data;
    const BASE = "https://res.cloudinary.com/doefjylyu/image/upload";

    const IMG = {
        logo: `${BASE}/f_auto,q_auto/hero_hpg6la.png`,
        business: `${BASE}/f_auto,q_auto/business_n2pxwd.png`,
    };

    const instagram = "https://instagram.com/onthegoafrica";
    const tiktok = "https://www.tiktok.com/@onthegoafrica";
    const linkedin = "https://www.linkedin.com/company/onthegoafrica";
    const youtube = "https://www.youtube.com/@onthegoafrica";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>You're Invited to Join ${branchName}</title>
<style>
  @media only screen and (max-width:680px){
    .container{width:100% !important}
    .col, .col-2{display:block !important; width:100% !important; max-width:100% !important}
    .p16{padding:16px !important}
    .center{text-align:center !important}
    .hide-m{display:none !important}
  }
  a { color:#1C46FF; text-decoration:none; }
  .btn {
    display:inline-block;
    padding:14px 32px;
    background:#1C46FF;
    color:#ffffff !important;
    border-radius:8px;
    text-decoration:none;
    font-weight:bold;
    font-size:16px;
  }
  .btn:hover {
    background:#0F3AD6;
  }
</style>
</head>
<body style="margin:0;background:#F5F6F8">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F6F8">
    <tr>
      <td align="center" style="padding:24px">
        <table role="presentation" width="640" class="container" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px 28px 16px 28px;text-align:center">
              <img src="${IMG.logo}" width="120" alt="OnTheGo" style="display:inline-block;height:auto" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="p16" style="padding:16px 28px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
              <h1 style="margin:0 0 16px 0;font-size:24px;line-height:32px;color:#0F172A;font-weight:bold">
                You've Been Invited! 🎉
              </h1>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#334155">
                Hey ${fullName},
              </p>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;color:#334155">
                Great news! You've been invited to join <strong>${branchName}</strong> as a <strong>${role}</strong> on the OnTheGo platform.
              </p>
              <p style="margin:0 0 24px 0;font-size:16px;line-height:24px;color:#334155">
                As part of the team, you'll be able to manage operations, track orders, monitor Wi-Fi infrastructure, and help grow the business—all from one powerful dashboard.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td class="p16" style="padding:0 28px 24px 28px;text-align:center">
              <a href="${inviteLink}" class="btn" style="display:inline-block;padding:14px 32px;background:#1C46FF;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">
                Complete Registration
              </a>
            </td>
          </tr>

          <!-- What's Next Section -->
          <tr>
            <td class="p16" style="padding:8px 28px 24px 28px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFF;border-radius:12px">
                <tr>
                  <td style="padding:20px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
                    <h3 style="margin:0 0 12px 0;font-size:18px;color:#0F172A">What's Next?</h3>
                    <ol style="margin:0;padding:0 0 0 20px;color:#334155;font-size:14px;line-height:22px">
                      <li style="margin-bottom:8px">Click the button above to set up your account</li>
                      <li style="margin-bottom:8px">Create your password and complete your profile</li>
                      <li style="margin-bottom:8px">Access your dashboard and start managing ${branchName}</li>
                      <li>Collaborate with your team to deliver amazing experiences</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Business Banner -->
          <tr>
            <td style="padding:0 28px 24px 28px">
              <img src="${IMG.business}" width="100%" alt="Manage Your Business" style="display:block;border-radius:12px" />
            </td>
          </tr>

          <!-- Help Section -->
          <tr>
            <td class="p16" style="padding:0 28px 24px 28px;font-family:Arial,Helvetica,sans-serif">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFF7ED;border-radius:12px;border:1px solid #FDBA74">
                <tr>
                  <td style="padding:16px;color:#9A3412;font-size:14px;line-height:20px">
                    <strong>⚠️ Important:</strong> This invitation link is unique to you. Please don't share it with anyone else. If you didn't expect this invitation or have questions, please contact the business owner directly.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="p16" style="padding:8px 28px 32px 28px;font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;line-height:22px">
              <p style="margin:0 0 8px 0">Need help? We're here for you!</p>
              <p style="margin:0 0 14px 0">
                <a href="${instagram}" style="color:#1C46FF;text-decoration:none">Instagram</a> |
                <a href="${tiktok}" style="color:#1C46FF;text-decoration:none">TikTok</a> |
                <a href="${linkedin}" style="color:#1C46FF;text-decoration:none">LinkedIn</a> |
                <a href="${youtube}" style="color:#1C46FF;text-decoration:none">YouTube</a>
              </p>
              <p style="margin:0 0 4px 0">Welcome to the team!</p>
              <p style="margin:0">With 💛,<br/>The OTG Team</p>
              <p style="margin:16px 0 0 0;color:#94A3B8;font-size:12px;text-align:center">&copy; ${new Date().getFullYear()} OnTheGo Africa. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
