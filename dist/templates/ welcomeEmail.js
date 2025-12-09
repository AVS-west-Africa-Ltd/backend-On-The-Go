"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welcomeEmail = void 0;
const welcomeEmail = (firstName) => {
    const BASE = "https://res.cloudinary.com/doefjylyu/image/upload";
    const IMG = {
        hero: `${BASE}/f_auto,q_auto/hero_hpg6la.png`,
        reviewBanner: `${BASE}/f_auto,q_auto/review-banner_c5wxhx.png`,
        phoneShot: `${BASE}/f_auto,q_auto/phone-shot.png`,
        business: `${BASE}/f_auto,q_auto/business_n2pxwd.png`,
        community: `${BASE}/f_auto,q_auto/community_wgqksn.png`,
        googleplay: `${BASE}/f_auto,q_auto/googleplay.png`,
        appstore: `${BASE}/f_auto,q_auto/appstore.png`,
    };
    const businessLink = "https://onthego.africa/business";
    const instagram = "https://instagram.com/onthegoafrica";
    const tiktok = "https://www.tiktok.com/@onthegoafrica";
    const linkedin = "https://www.linkedin.com/company/onthegoafrica";
    const youtube = "https://www.youtube.com/@onthegoafrica";
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Welcome to OTG</title>
<style>
  @media only screen and (max-width:680px){
    .container{width:100% !important}
    .col, .col-2{display:block !important; width:100% !important; max-width:100% !important}
    .p16{padding:16px !important}
    .center{text-align:center !important}
    .hide-m{display:none !important}
  }
  a { color:#1C46FF; }
</style>
</head>
<body style="margin:0;background:#F5F6F8">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F6F8">
    <tr>
      <td align="center" style="padding:24px">
        <table role="presentation" width="640" class="container" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden">
          <!-- Hero -->
          <tr>
            <td>
              <img src="${IMG.hero}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td class="p16" style="padding:24px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:24px;">Hey ${firstName || "there"},</p>
              <p style="margin:0;font-size:16px;line-height:24px;color:#334155">
                Welcome to the OTG community—where staying connected is no longer a hustle!
                Whether you're catching up on schoolwork, working on the go, or just exploring,
                we've made it super easy to discover reliable Wi-Fi wherever you go.
              </p>
            </td>
          </tr>
            <td>
              <img src="${IMG.reviewBanner}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>



          <!-- Features list -->
          <tr>
            <td class="p16" style="padding:8px 28px 8px 28px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFF;border-radius:12px">
                <tr>
                  <td style="padding:18px 18px 6px 18px;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
                    <ul style="margin:0;padding:0 0 0 18px;color:#334155;font-size:14px;line-height:22px">
                      <li style="margin-bottom:8px"><strong>Find Wi-Fi Hotspots</strong> — Cafes, co-working spaces, lounges, even parks.</li>
                      <li style="margin-bottom:8px"><strong>Real-Time Reviews</strong> — Know where the Wi-Fi is fast, stable, and worth your visit.</li>
                      <li style="margin-bottom:8px"><strong>Drop a Review</strong> — Help others and earn discounts.</li>
                      <li style="margin-bottom:8px"><strong>Follow & Interact</strong> — Connect with friends, businesses, and your city.</li>
                      <li><strong>Get Rewarded</strong> — Reviews and referrals unlock real-life perks.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

            <td>
              <img src="${IMG.business}" width="640" alt="Stay Connected, Anywhere." style="display:block;width:100%;height:auto" />
            </td>

          <!-- Business CTA -->
          <tr>
            <td class="p16" style="padding:8px 28px 8px 28px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #EEF2FF;border-radius:12px">
                <tr>
                  <td class="col-2" valign="top" style="padding:16px">
                     <p style="font-family:Arial,Helvetica,sans-serif;margin:0 0 12px 0;color:#334155;font-size:14px;line-height:22px">
                      Own a business? Got a spot with Wi-Fi? List on OTG and attract the right crowd every day.
                      Get discovered, receive real feedback, and reward users who show love.
                    </p>
                 
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Community banner -->
          <tr>
            <td style="padding:8px 28px 8px 28px">
              <img src="${IMG.community}" width="100%" alt="Built by the Community, for the Community." style="display:block;border-radius:12px" />
            </td>
          </tr>

          <!-- Social & Footer -->
          <tr>
            <td class="p16" style="padding:8px 28px 24px 28px;font-family:Arial,Helvetica,sans-serif;color:#334155;font-size:14px;line-height:22px">
              <p style="margin:0 0 8px 0">Follow us to stay in the loop</p>
              <p style="margin:0 0 14px 0">
                <a href="${instagram}" style="color:#1C46FF;text-decoration:none">Instagram</a> |
                <a href="${tiktok}" style="color:#1C46FF;text-decoration:none">TikTok</a> |
                <a href="${linkedin}" style="color:#1C46FF;text-decoration:none">LinkedIn</a> |
                <a href="${youtube}" style="color:#1C46FF;text-decoration:none">YouTube</a>
              </p>
            
              <p style="margin:0 0 4px 0">Stay plugged in.</p>
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
exports.welcomeEmail = welcomeEmail;
