/**
 * Vercel Serverless Function: /api/pdf-request
 * Handles Brevo Lead Capture & Automated PDF Delivery Email
 */

function generateEmailHtml(firstName, downloadUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free Copy: The 7-Minute Weight Loss Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">
    Your free digital copy of The 7-Minute Weight Loss Reset is ready inside! Download your PDF now.
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0b1120;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 30px;text-align:center;border-bottom:3px solid #f59e0b;">
              <span style="display:inline-block;background:rgba(245,158,11,0.2);color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;border:1px solid rgba(245,158,11,0.4);">
                ⚡ Instant PDF Access
              </span>
              <h1 style="margin:6px 0 0 0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                Sophia Carter <span style="color:#f59e0b;">Health</span>
              </h1>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:32px 32px 20px 32px;">
              <h2 style="margin:0 0 14px 0;color:#0f172a;font-size:22px;font-weight:800;line-height:1.3;">
                Hi ${firstName}, Your Free E-Book Is Ready! 🎉
              </h2>
              <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">
                Thank you for requesting your complimentary digital copy of <strong>The 7-Minute Weight Loss Reset</strong>.
              </p>
              <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
                This morning protocol was specifically developed to help reactivate slow metabolism, burn stubborn belly fat, and sustain all-day natural energy—without starvation diets or exhausting gym workouts.
              </p>

              <!-- Book Display Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td align="center" style="padding:24px 20px;">
                    <a href="${downloadUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="https://wellnesswithsophia.cc/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset-Book-Cover.png" alt="The 7-Minute Weight Loss Reset Book Cover" width="220" style="display:block;border-radius:8px;box-shadow:0 12px 24px rgba(0,0,0,0.18);max-width:100%;height:auto;margin-bottom:14px;">
                    </a>
                    <div style="color:#0f172a;font-size:17px;font-weight:800;margin-bottom:6px;">
                      The 7-Minute Weight Loss Reset
                    </div>
                    <div style="color:#64748b;font-size:13px;font-weight:500;">
                      Complete Morning Protocol • Digital PDF Edition
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Big Beautiful Gold CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#111827;font-size:16px;font-weight:800;text-decoration:none;padding:16px 36px;border-radius:50px;box-shadow:0 8px 20px rgba(245,158,11,0.45);letter-spacing:0.3px;border:1px solid #fbbf24;">
                      📥 DOWNLOAD YOUR FREE PDF NOW
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:10px;">
                    <span style="color:#64748b;font-size:12px;font-weight:600;">
                      ✓ 100% Free • Instant Download • PDF Format
                    </span>
                  </td>
                </tr>
              </table>

              <!-- What's Inside Checklist Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin-bottom:26px;">
                <tr>
                  <td>
                    <div style="color:#92400e;font-size:14px;font-weight:800;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">
                      ✨ What You'll Discover Inside:
                    </div>
                    <ul style="margin:0;padding-left:20px;color:#78350f;font-size:14px;line-height:1.7;">
                      <li><strong>The 7-Minute Metabolic Switch:</strong> Trigger your body's fat-burning mode every morning.</li>
                      <li><strong>3 Metabolism-Freezing "Healthy" Foods:</strong> Common pantry items secretly blocking fat burn.</li>
                      <li><strong>All-Day Clean Energy:</strong> Eliminate afternoon crashes without endless coffee.</li>
                      <li><strong>Zero-Gym Daily Movements:</strong> Joint-friendly, easy routines designed for older adults.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Direct Link Fallback -->
              <p style="margin:0 0 24px 0;color:#64748b;font-size:13px;line-height:1.5;background:#f1f5f9;padding:12px 16px;border-radius:8px;">
                <strong>Having trouble with the button?</strong> Copy and paste this link into your browser:<br>
                <a href="${downloadUrl}" style="color:#0284c7;word-break:break-all;text-decoration:underline;">${downloadUrl}</a>
              </p>

              <!-- Sign-off -->
              <p style="margin:0 0 6px 0;color:#334155;font-size:15px;line-height:1.6;">
                Here's to your renewed health, confidence, and vibrant energy!
              </p>
              <p style="margin:0 0 2px 0;color:#0f172a;font-size:16px;font-weight:800;">
                Sophia Carter
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;">
                Holistic Health & Wellness Specialist • Sophia Carter Health
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 30px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0 0 10px 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                You received this email because you requested a free copy of The 7-Minute Weight Loss Reset on <a href="https://wellnesswithsophia.cc" style="color:#f59e0b;text-decoration:none;">wellnesswithsophia.cc</a>.
              </p>
              <p style="margin:0;color:#64748b;font-size:11px;">
                &copy; 2026 Sophia Carter Health. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    let body = req.body;
    if (!body) {
      try {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const raw = Buffer.concat(buffers).toString('utf-8');
        if (raw) {
          body = JSON.parse(raw);
        }
      } catch (e) {
        body = {};
      }
    } else if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const marketingConsent = Boolean(body.marketing_consent);

    if (!fullName || fullName.length < 2) {
      res.status(400).json({ success: false, error: 'Please enter your full name.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
      return;
    }

    const apiKey = process.env.BREVO_API_KEY;
    const listId = process.env.BREVO_CONTACT_LIST_ID ? parseInt(process.env.BREVO_CONTACT_LIST_ID, 10) : 7;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'support@wellnesswithsophia.cc';
    const senderName = process.env.BREVO_SENDER_NAME || 'Sophia Carter';
    const firstName = fullName.split(' ')[0] || fullName;
    const downloadUrl = 'https://wellnesswithsophia.cc/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf';

    // 1. Sync Contact into Brevo (List 7)
    if (apiKey) {
      const contactPayload = {
        email: email,
        attributes: {
          FIRSTNAME: firstName,
          FULLNAME: fullName,
          OPT_IN: marketingConsent,
          REQUESTED_PDF: 'The 7-Minute Weight Loss Reset',
          SUBMISSION_DATE: new Date().toISOString().split('T')[0]
        },
        listIds: listId ? [listId] : [7],
        updateEnabled: true
      };

      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactPayload)
      }).catch(err => {
        console.error('[Brevo Contact Sync Error]', err);
      });

      // 2. Dispatch Transactional PDF Delivery Email
      await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail
          },
          to: [
            {
              email: email,
              name: fullName
            }
          ],
          subject: '🎁 Your Free Copy: The 7-Minute Weight Loss Reset (Instant PDF Download)',
          htmlContent: generateEmailHtml(firstName, downloadUrl)
        })
      }).catch(err => {
        console.error('[Brevo Email Dispatch Error]', err);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Success! Your free PDF has been dispatched directly to your email inbox.',
      downloadUrl: downloadUrl,
      productName: 'The 7-Minute Weight Loss Reset'
    });
  } catch (error) {
    console.error('[Vercel Handler Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error processing request.' });
  }
};
