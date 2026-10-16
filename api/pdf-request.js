/**
 * Vercel Serverless Function: /api/pdf-request
 * Handles Brevo Lead Capture & Contact Synchronization for Vercel Deployments
 */

module.exports = async function handler(req, res) {
  // Set CORS headers
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const fullName = String(body.full_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const marketingConsent = Boolean(body.marketing_consent);
    const productId = String(body.product_id || 'weight-loss-reset').trim();

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
    const firstName = fullName.split(' ')[0] || fullName;
    const downloadUrl = '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf';

    // 1. Sync Contact into Brevo (List 7)
    if (apiKey && apiKey !== 'YOUR_BREVO_API_KEY_HERE') {
      const contactPayload = {
        email: email,
        attributes: {
          FIRSTNAME: firstName,
          FULLNAME: fullName,
          OPT_IN: marketingConsent,
          REQUESTED_PDF: 'The 7-Minute Weight Loss Reset',
          SUBMISSION_DATE: new Date().toISOString().split('T')[0]
        },
        updateEnabled: true
      };

      if (listId) {
        contactPayload.listIds = [listId];
      }

      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactPayload)
      }).catch(err => {
        console.error('[Brevo Vercel Error]', err);
      });
    }

    res.status(200).json({
      success: true,
      message: 'Success! Your PDF is ready.',
      downloadUrl: downloadUrl,
      productName: 'The 7-Minute Weight Loss Reset'
    });
  } catch (error) {
    console.error('[Vercel Handler Error]', error);
    res.status(500).json({ success: false, error: 'Internal server error processing request.' });
  }
};
