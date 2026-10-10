/**
 * Sophia Carter Health - Production Backend Server
 * Handles Brevo Email Automation, Lead Capture, Database Persistence & Static Asset Serving
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { saveLead, updateLeadStatus, getRecentSubmission } = require('./db.js');
const { syncBrevoContact, sendPdfDeliveryEmail } = require('./brevo-service.js');

// ── 1. Load Environment Variables from .env file ─────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valParts] = trimmed.split('=');
        const val = valParts.join('=').trim();
        process.env[key.trim()] = val;
      }
    });
  }
}
loadEnv();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ── 2. Server-side Allowed Product Catalog ────────────────────────────────────
const PRODUCT_CATALOG = {
  'weight-loss-reset': {
    id: 'weight-loss-reset',
    name: 'The 7-Minute Weight Loss Reset',
    pdfPath: '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf',
    filename: 'The-7-Minute-Weight-Loss-Reset.pdf'
  },
  'womens-health-guide': {
    id: 'womens-health-guide',
    name: "Sophia's Women's Health & Wellness Guide",
    pdfPath: '/weight-loss-book/assets/images/The-7-Minute-Weight-Loss-Reset.pdf',
    filename: 'Womens-Health-Guide.pdf'
  }
};

// ── 3. Simple In-Memory Rate Limiting ─────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, clientData);
    return false;
  }

  clientData.count += 1;
  rateLimitMap.set(ip, clientData);
  return clientData.count > MAX_REQUESTS_PER_WINDOW;
}

// ── 4. MIME Types for Static File Server ──────────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

// ── 5. Main HTTP Request Router ───────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Enable CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // ── API Endpoint: POST /api/pdf-request ────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/pdf-request') {
    if (isRateLimited(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        let payload = {};
        try {
          payload = JSON.parse(body);
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid JSON request format.' }));
          return;
        }

        const fullName = String(payload.full_name || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const productId = String(payload.product_id || 'weight-loss-reset').trim();
        const marketingConsent = Boolean(payload.marketing_consent);
        const source = String(payload.source || 'website_modal').trim();

        // 1. Backend Input Validation & Sanitization
        if (!fullName || fullName.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please enter your valid full name.' }));
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please enter a valid email address.' }));
          return;
        }

        // 2. Server-side Product Allowlist Check
        const productInfo = PRODUCT_CATALOG[productId];
        if (!productInfo) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid or unsupported product requested.' }));
          return;
        }

        // Absolute download link for email and client confirmation
        const downloadUrl = `${BASE_URL.replace(/\/$/, '')}${productInfo.pdfPath}`;

        // 3. Idempotency Safeguard (prevent spam submissions within 60s)
        const recentSub = getRecentSubmission(email, productId, 60);
        if (recentSub && (recentSub.delivery_status === 'sent' || recentSub.delivery_status === 'mock_sent')) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Your request was already processed recently! Your email is on the way.',
            downloadUrl,
            productName: productInfo.name,
            alreadyProcessed: true
          }));
          return;
        }

        // 4. Save Customer Record in SQLite Database
        const leadId = saveLead({
          full_name: fullName,
          email,
          source,
          product_id: productId,
          marketing_consent: marketingConsent
        });

        // 5. Create / Update Brevo Contact
        const brevoResult = await syncBrevoContact({
          fullName,
          email,
          productId,
          productName: productInfo.name,
          marketingConsent
        });

        // 6. Send Transactional PDF Delivery Email
        const emailResult = await sendPdfDeliveryEmail({
          fullName,
          email,
          productName: productInfo.name,
          downloadUrl
        });

        // 7. Update Database Lead Record Status
        const status = emailResult.success ? 'sent' : (emailResult.mode === 'mock' ? 'mock_sent' : 'failed');
        updateLeadStatus(leadId, status, brevoResult.contactId || null);

        // 8. Return Response to Client
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Success! Check your inbox for your PDF, or download it directly below.',
          downloadUrl,
          productName: productInfo.name,
          emailSent: emailResult.success
        }));

      } catch (err) {
        console.error('[API Server Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Server error processing request. Please try again.' }));
      }
    });
    return;
  }

  // ── Static Asset & HTML Page Serving ──────────────────────────────────────
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  // If path is a directory or root, resolve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Not Found</h1><p>The requested page or file does not exist.</p>');
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Sophia Carter Health Server Running on Port ${PORT}`);
  console.log(`🔗 Local URL: ${BASE_URL}`);
  console.log(`=======================================================`);
});
