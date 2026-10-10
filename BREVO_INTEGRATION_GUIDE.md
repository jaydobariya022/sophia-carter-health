# Brevo Email Automation & PDF Lead Capture Integration Guide

## 1. Executive Summary

This project has been upgraded with a production-ready **Brevo Email Automation** and **PDF Lead Delivery System**. When visitors request a PDF e-book guide on the website:

1. A responsive popup modal collects their **Full Name**, **Email Address**, and optional **Marketing Consent**.
2. Data is validated on both frontend and backend.
3. Customer leads are saved persistently in a local **SQLite Database** (`data/leads.db`).
4. Contacts are synchronized with **Brevo API v3** (`/v3/contacts`), setting custom attributes and assigning marketing opt-in contacts to a dedicated Brevo list.
5. An automated **Transactional Email** containing the customer's personalized greeting and PDF access link is dispatched via **Brevo SMTP API** (`/v3/smtp/email`).
6. Idempotency safeguards prevent duplicate submissions and duplicate emails.

---

## 2. Files Created and Modified

| File Path | Description | Status |
| :--- | :--- | :--- |
| [`server.js`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/server.js) | Production Node.js backend server handling static files, API routing, rate limiting, and product allowlist validation. | Created |
| [`db.js`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/db.js) | SQLite database layer managing schema initialization, lead insertion, status updates, and idempotency queries. | Created |
| [`brevo-service.js`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/brevo-service.js) | Brevo v3 API service integration for contact upserting and transactional email dispatch. | Created |
| [`assets/css/brevo-pdf-modal.css`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/assets/css/brevo-pdf-modal.css) | Modern, responsive, accessible popup modal styling matching Sophia Carter Health aesthetics. | Created |
| [`assets/js/brevo-pdf-modal.js`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/assets/js/brevo-pdf-modal.js) | Frontend script managing modal lifecycle, keyboard accessibility (ESC/trap focus), client validation, and API fetch calls. | Created |
| [`.env`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/.env) | Secret environment configuration file. | Created |
| [`.env.example`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/.env.example) | Public environment configuration template. | Created |
| [`weight-loss-book/index.html`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/weight-loss-book/index.html) | Landing page updated with marketing consent checkboxes and modal CSS/JS links. | Modified |
| [`weight-loss-book/js/script.js`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/weight-loss-book/js/script.js) | Landing page JS updated to communicate directly with `/api/pdf-request`. | Modified |
| [`index.html`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/index.html) | Root index updated with "Get Free E-Book (PDF)" trigger button linking to the modal. | Modified |

---

## 3. Database Schema (`data/leads.db`)

Customer records are stored in the SQLite `leads` table:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'website',
  product_id TEXT NOT NULL,
  pdf_requested_at TEXT NOT NULL,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  consent_timestamp TEXT,
  consent_source TEXT,
  brevo_contact_id TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_email_product ON leads(email, product_id);
```

---

## 4. Environment Variables Configuration

Create or update the `.env` file in the root directory:

```ini
PORT=3000
BASE_URL=http://localhost:3000

# Brevo API Key
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Verified Brevo Sender
BREVO_SENDER_EMAIL=support@sophiacarterhealth.com
BREVO_SENDER_NAME=Sophia Carter Health

# Optional: Brevo Transactional Email Template ID
BREVO_PDF_TEMPLATE_ID=

# Optional: Brevo Contact List ID for Opt-in Marketing Contacts
BREVO_CONTACT_LIST_ID=
```

---

## 5. Brevo Setup Instructions

### Step 5.1: Obtain API Key
1. Log in to your [Brevo Dashboard](https://app.brevo.com).
2. Go to **Settings** -> **SMTP & API Keys** (or navigate to `https://app.brevo.com/settings/keys/api`).
3. Click **Generate a new API key**. Name it `Sophia Carter Health Website`.
4. Copy the generated key (starts with `xkeysib-`) and paste it into `.env` as `BREVO_API_KEY`.

### Step 5.2: Verify Sender Email
1. In Brevo, navigate to **Senders & IP** -> **Senders** (`https://app.brevo.com/senders`).
2. Add and verify your domain/sender email address (e.g., `support@sophiacarterhealth.com`).
3. Update `BREVO_SENDER_EMAIL` in `.env` to match your verified sender.

### Step 5.3: Marketing Contact List Setup (Optional)
1. Navigate to **Contacts** -> **Lists** (`https://app.brevo.com/contact/list`).
2. Create a new list called `PDF Download Subscribers`.
3. Note the numerical **List ID** (e.g., `2`) and set `BREVO_CONTACT_LIST_ID=2` in `.env`.
4. *Compliance Guarantee*: Only customers who explicitly check the promotional email consent box are added to this list.

### Step 5.4: Transactional Email Template Setup (Optional)
If you prefer to design your email in Brevo's drag-and-drop builder:
1. Navigate to **Transactional** -> **Templates** (`https://app.brevo.com/templates`).
2. Create a template titled `PDF Download Delivery`.
3. Insert dynamic placeholder tags:
   - `{{ params.FIRSTNAME }}`
   - `{{ params.PRODUCT_NAME }}`
   - `{{ params.DOWNLOAD_URL }}`
   - `{{ params.SUPPORT_EMAIL }}`
4. Note the Template ID number and set `BREVO_PDF_TEMPLATE_ID=<ID>` in `.env`.
5. If left blank, the system automatically uses a built-in responsive HTML transactional template.

---

## 6. How to Add or Manage Multiple PDF Products

All PDF products are protected by a server-side allowlist catalog in [`server.js`](file:///d:/Jay/PD/Sophia%20Carter%20FB%20Page/sophia-carter-health/server.js):

```javascript
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
```

To trigger the modal for any product from any HTML page, simply add the attribute `data-pdf-trigger="<PRODUCT_ID>"` to any button or link:

```html
<button data-pdf-trigger="weight-loss-reset">Get Weight Loss PDF</button>
<button data-pdf-trigger="womens-health-guide">Get Women's Health PDF</button>
```

---

## 7. Running & Deploying

### Running Locally
Run the server using Node:
```powershell
node server.js
```
Open `http://localhost:3000` in your browser.

### Deploying to Production (VPS / Render / Railway / Heroku / AWS)
1. Ensure Node.js 20+ or 22+ is installed on the host.
2. Set environment variables on your hosting provider dashboard.
3. Start process using `node server.js` or PM2: `pm2 start server.js --name "sophia-carter-health"`.
