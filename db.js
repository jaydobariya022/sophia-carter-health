const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'leads.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Database Schema
function initSchema() {
  db.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_leads_requested_at ON leads(pdf_requested_at);
  `);
}

initSchema();

/**
 * Save or update customer lead record
 */
function saveLead(leadData) {
  const now = new Date().toISOString();
  
  const insertStmt = db.prepare(`
    INSERT INTO leads (
      full_name,
      email,
      source,
      product_id,
      pdf_requested_at,
      marketing_consent,
      consent_timestamp,
      consent_source,
      delivery_status,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    leadData.full_name,
    leadData.email.toLowerCase().trim(),
    leadData.source || 'website',
    leadData.product_id,
    now,
    leadData.marketing_consent ? 1 : 0,
    leadData.marketing_consent ? now : null,
    leadData.marketing_consent ? (leadData.source || 'website_form_checkbox') : null,
    'pending',
    now,
    now
  );

  return result.lastInsertRowid;
}

/**
 * Update lead record with Brevo status and ID
 */
function updateLeadStatus(id, deliveryStatus, brevoContactId = null) {
  const now = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE leads
    SET delivery_status = ?,
        brevo_contact_id = COALESCE(?, brevo_contact_id),
        updated_at = ?
    WHERE id = ?
  `);
  updateStmt.run(deliveryStatus, brevoContactId ? String(brevoContactId) : null, now, id);
}

/**
 * Check recent submissions to prevent duplicate requests (Idempotency safeguard)
 */
function getRecentSubmission(email, productId, secondsThreshold = 60) {
  const stmt = db.prepare(`
    SELECT * FROM leads
    WHERE email = ? AND product_id = ?
    ORDER BY id DESC LIMIT 1
  `);
  const row = stmt.get(email.toLowerCase().trim(), productId);
  if (!row) return null;

  const lastTime = new Date(row.pdf_requested_at).getTime();
  const nowTime = Date.now();
  if ((nowTime - lastTime) / 1000 < secondsThreshold) {
    return row;
  }
  return null;
}

module.exports = {
  db,
  saveLead,
  updateLeadStatus,
  getRecentSubmission
};
