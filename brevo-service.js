/**
 * Brevo Official API v3 Service Integration
 * Handles Brevo Contact creation/updates and Transactional PDF delivery email triggering.
 */

const BREVO_API_BASE = 'https://api.brevo.com/v3';

/**
 * Helper to get configured Brevo environment variables
 */
function getBrevoConfig() {
  return {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'support@sophiacarterhealth.com',
    senderName: process.env.BREVO_SENDER_NAME || 'Sophia Carter Health',
    templateId: process.env.BREVO_PDF_TEMPLATE_ID ? parseInt(process.env.BREVO_PDF_TEMPLATE_ID, 10) : null,
    listId: process.env.BREVO_CONTACT_LIST_ID ? parseInt(process.env.BREVO_CONTACT_LIST_ID, 10) : null
  };
}

/**
 * Create or update contact in Brevo database
 */
async function syncBrevoContact({ fullName, email, productId, productName, marketingConsent }) {
  const config = getBrevoConfig();

  if (!config.apiKey || config.apiKey === 'your_brevo_api_key_here') {
    console.warn('[Brevo Warning] BREVO_API_KEY is missing or unconfigured in .env');
    return { success: false, mode: 'mock', message: 'Brevo API key not configured' };
  }

  const firstName = fullName.trim().split(' ')[0] || fullName;
  const nowStr = new Date().toISOString().split('T')[0];

  const payload = {
    email: email.toLowerCase().trim(),
    attributes: {
      FIRSTNAME: firstName,
      FULLNAME: fullName,
      OPT_IN: Boolean(marketingConsent),
      REQUESTED_PDF: productName || productId,
      SUBMISSION_DATE: nowStr
    },
    updateEnabled: true
  };

  // Only add contact to marketing list if explicit marketing consent was granted and List ID is configured
  if (marketingConsent && config.listId && !isNaN(config.listId)) {
    payload.listIds = [config.listId];
  }

  try {
    const res = await fetch(`${BREVO_API_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok && res.status !== 201 && res.status !== 204 && res.status !== 200) {
      console.error('[Brevo Contact Error]', res.status, responseData);
      return { success: false, status: res.status, error: responseData.message || 'Failed to sync contact' };
    }

    return {
      success: true,
      contactId: responseData.id || email,
      message: 'Brevo contact synchronized successfully'
    };
  } catch (err) {
    console.error('[Brevo Contact Network Exception]', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send PDF Delivery Email via Brevo Transactional Email API
 */
async function sendPdfDeliveryEmail({ fullName, email, productName, downloadUrl }) {
  const config = getBrevoConfig();

  if (!config.apiKey || config.apiKey === 'your_brevo_api_key_here') {
    console.warn('[Brevo Warning] BREVO_API_KEY is not configured. Simulating transactional email.');
    return { success: false, mode: 'mock', message: 'Brevo API key not set' };
  }

  const firstName = fullName.trim().split(' ')[0] || fullName;

  let payload = {
    to: [{ email: email.toLowerCase().trim(), name: fullName }],
    sender: { email: config.senderEmail, name: config.senderName }
  };

  // Use Brevo Transactional Template if BREVO_PDF_TEMPLATE_ID is configured
  if (config.templateId && !isNaN(config.templateId)) {
    payload.templateId = config.templateId;
    payload.params = {
      FIRSTNAME: firstName,
      PRODUCT_NAME: productName,
      DOWNLOAD_URL: downloadUrl,
      SUPPORT_EMAIL: config.senderEmail
    };
  } else {
    // Fallback: Send rich, responsive HTML transactional email
    payload.subject = `Your PDF Is Ready - ${productName}`;
    payload.htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PDF Download</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333333; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #f59e0b; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 36px 32px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111827; }
    .card { background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }
    .cta-wrapper { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background-color: #f59e0b; color: #111827; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: 700; border-radius: 50px; box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
    .footer a { color: #f59e0b; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sophia Carter Health</h1>
      <p>Your Free Digital Guide Is Ready</p>
    </div>
    <div class="content">
      <div class="greeting">Hi ${firstName},</div>
      <p>Thank you for requesting your copy of <strong>${productName}</strong>!</p>
      
      <div class="card">
        <strong style="color: #111827;">What's Included:</strong><br>
        Your digital PDF e-book guide is ready for instant access and download below. You can view it on your mobile device, tablet, or desktop computer anytime.
      </div>

      <div class="cta-wrapper">
        <a href="${downloadUrl}" class="btn" target="_blank">📥 DOWNLOAD YOUR PDF NOW</a>
      </div>

      <p>If the button above does not work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px; color: #4b5563;"><a href="${downloadUrl}">${downloadUrl}</a></p>

      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 28px 0;">

      <p style="font-size: 13px; color: #6b7280;">
        If you have any questions or need assistance accessing your guide, reply directly to this email or contact our support team at <a href="mailto:${config.senderEmail}">${config.senderEmail}</a>.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Sophia Carter Health. All rights reserved.<br>
      You received this email because you requested a PDF guide on our website.
    </div>
  </div>
</body>
</html>
    `;
  }

  try {
    const res = await fetch(`${BREVO_API_BASE}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[Brevo Transactional Email Error]', res.status, responseData);
      return { success: false, status: res.status, error: responseData.message || 'Failed to send transactional email' };
    }

    return {
      success: true,
      messageId: responseData.messageId || 'sent',
      message: 'Transactional email dispatched successfully'
    };
  } catch (err) {
    console.error('[Brevo Email Network Exception]', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  syncBrevoContact,
  sendPdfDeliveryEmail,
  getBrevoConfig
};
