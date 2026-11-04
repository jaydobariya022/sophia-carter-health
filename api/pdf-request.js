/**
 * Vercel Serverless Function: /api/pdf-request
 * Handles Brevo Lead Capture & Automated 3-Book Bundle PDF Delivery Email
 */

const fs = require('fs');
const path = require('path');

// Try loading .env if running in Node environment
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valParts] = trimmed.split('=');
        const k = key.trim();
        if (!process.env[k]) {
          process.env[k] = valParts.join('=').trim();
        }
      }
    });
  }
} catch (e) {}

const BOOKS = [
  {
    num: 1,
    title: "Why the Scale Won't Budge After 40",
    subtitle: "7 gentle, realistic habits that work with your changing body",
    downloadUrl: "https://wellnesswithsophia.cc/weight-loss-book/assets/images/Why-the-Scale-Wont-Budge-After-40.pdf",
    coverUrl: "https://wellnesswithsophia.cc/weight-loss-book/assets/images/book-why-scale-wont-budge.jpg",
    badge: "Metabolism Guide"
  },
  {
    num: 2,
    title: "Sunday Prep, Easy Week",
    subtitle: "Healthy meal prep & 12 simple morning drinks for women over 40",
    downloadUrl: "https://wellnesswithsophia.cc/weight-loss-book/assets/images/Sunday-Prep-Easy-Week.pdf",
    coverUrl: "https://wellnesswithsophia.cc/weight-loss-book/assets/images/book-sunday-prep-easy-week.jpg",
    badge: "Recipe & Meal Prep"
  },
  {
    num: 3,
    title: "The 7-Minute Weight Loss Reset",
    subtitle: "Simple morning habits, smart food choices & daily rituals",
    downloadUrl: "https://wellnesswithsophia.cc/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf",
    coverUrl: "https://wellnesswithsophia.cc/weight-loss-book/assets/images/book-7-minute-weight-loss-reset.jpg",
    badge: "Daily Routine Guide"
  }
];

function generateEmailHtml(firstName) {
  const booksCardsHtml = BOOKS.map(b => `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:20px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04);">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="110" valign="top" style="padding-right:18px;">
                <a href="${b.downloadUrl}" target="_blank" style="text-decoration:none;display:block;">
                  <img src="${b.coverUrl}" alt="${b.title}" width="110" style="display:block;border-radius:8px;box-shadow:0 6px 14px rgba(0,0,0,0.15);width:100%;max-width:110px;height:auto;border:1px solid #e2e8f0;">
                </a>
              </td>
              <td valign="middle">
                <span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:10px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:12px;text-transform:uppercase;margin-bottom:6px;">
                  Book #${b.num} • ${b.badge}
                </span>
                <h3 style="margin:0 0 6px 0;color:#0f172a;font-size:17px;font-weight:800;line-height:1.3;">
                  ${b.title}
                </h3>
                <p style="margin:0 0 14px 0;color:#64748b;font-size:13px;line-height:1.4;">
                  ${b.subtitle}
                </p>
                <a href="${b.downloadUrl}" target="_blank" style="display:inline-block;background:#1b4332;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:6px;letter-spacing:0.3px;">
                  📥 Download Book #${b.num} (PDF)
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your 3 Free E-Books Are Ready!</title>
</head>
<body style="margin:0;padding:0;background-color:#0b1120;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">
    Hi ${firstName}, here are your instant download links for all 3 free women's health & weight loss eBooks.
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0b1120;padding:30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:620px;background-color:#f8fafc;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);">
          
          <!-- Top Header Brand Bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 30px;text-align:center;border-bottom:3px solid #f59e0b;">
              <span style="display:inline-block;background:rgba(245,158,11,0.2);color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:1.5px;padding:5px 14px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;border:1px solid rgba(245,158,11,0.4);">
                ⚡ Instant Digital Download Bundle
              </span>
              <h1 style="margin:6px 0 0 0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                Sophia Carter <span style="color:#f59e0b;">Health</span>
              </h1>
            </td>
          </tr>

          <!-- Collection Banner Image -->
          <tr>
            <td align="center" style="background:#ffffff;padding:20px 24px 0 24px;">
              <img src="https://wellnesswithsophia.cc/weight-loss-book/assets/images/bundle-collection.jpg" alt="Free 3-Book Bundle" width="560" style="display:block;border-radius:10px;width:100%;max-width:560px;height:auto;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 30px 20px 30px;">
              <h2 style="margin:0 0 12px 0;color:#0f172a;font-size:22px;font-weight:800;line-height:1.3;">
                Hi ${firstName}, Your 3 Free E-Books Are Ready! 🎉
              </h2>
              <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">
                Thank you for requesting the complete <strong>Women Over 40 Wellness & Weight Loss Bundle</strong>!
              </p>
              <p style="margin:0 0 24px 0;color:#475569;font-size:15px;line-height:1.6;">
                These 3 guides were created specifically to help reset metabolism, burn stubborn fat naturally, simplify meal prep, and give you clean, lasting daily energy. Click each button below to download your digital copies immediately:
              </p>

              <!-- Books List -->
              ${booksCardsHtml}

              <!-- Sign-off -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-top:10px;margin-bottom:24px;">
                <tr>
                  <td>
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
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 30px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0 0 10px 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                You received this email because you requested the 3 Free E-Books on <a href="https://wellnesswithsophia.cc" style="color:#f59e0b;text-decoration:none;">wellnesswithsophia.cc</a>.
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

    // 1. Sync Contact into Brevo (List 7)
    if (apiKey) {
      const contactPayload = {
        email: email,
        attributes: {
          FIRSTNAME: firstName,
          FULLNAME: fullName,
          OPT_IN: marketingConsent,
          REQUESTED_PDF: 'Women Over 40 3-Book Bundle',
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

      // 2. Dispatch Transactional 3-Book PDF Delivery Email
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
          subject: '🎁 Your 3 Free E-Books Are Ready! (Instant PDF Download)',
          htmlContent: generateEmailHtml(firstName)
        })
      }).catch(err => {
        console.error('[Brevo Email Dispatch Error]', err);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Success! Your 3 free eBooks have been sent directly to your email inbox.',
      books: BOOKS.map(b => ({ name: b.title, path: b.downloadUrl }))
    });
  } catch (error) {
    console.error('[Vercel Handler Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error processing request.' });
  }
};
