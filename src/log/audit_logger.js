// src/log/audit_logger.js

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'db', 'audit_log.db');

let db = null;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  initSchema(db);
  return db;
}

function initSchema(database) {
  database.prepare(
    `CREATE TABLE IF NOT EXISTS audit_log (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id          TEXT NOT NULL,
      customer_id         TEXT NOT NULL,
      event_type          TEXT NOT NULL,
      amount              REAL,
      attempt_number      INTEGER,
      diagnosis           TEXT,
      recommended_action  TEXT,
      confidence          REAL,
      reasoning           TEXT,
      action_taken        TEXT,
      action_status       TEXT,
      action_detail       TEXT,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    )`
  ).run();

  database.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_log(session_id)`).run();
  database.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_customer ON audit_log(customer_id)`).run();
}

function logRecord({ event, diagnosis, actionResult }) {
  const database = getDb();
  const stmt = database.prepare(
    `INSERT INTO audit_log (
      session_id, customer_id, event_type, amount, attempt_number,
      diagnosis, recommended_action, confidence, reasoning,
      action_taken, action_status, action_detail
    ) VALUES (
      @session_id, @customer_id, @event_type, @amount, @attempt_number,
      @diagnosis, @recommended_action, @confidence, @reasoning,
      @action_taken, @action_status, @action_detail
    )`
  );

  return stmt.run({
    session_id: event.session_id,
    customer_id: event.customer_id,
    event_type: event.event_type,
    amount: event.amount ?? null,
    attempt_number: event.attempt_number ?? null,
    diagnosis: diagnosis?.diagnosis ?? null,
    recommended_action: diagnosis?.recommended_action ?? null,
    confidence: diagnosis?.confidence ?? null,
    reasoning: diagnosis?.reasoning ?? null,
    action_taken: actionResult?.action ?? null,
    action_status: actionResult?.status ?? null,
    action_detail: actionResult?.detail ?? null
  });
}

function getRecentActionsForSession(sessionId, { limit = 10 } = {}) {
  const database = getDb();
  return database
    .prepare(`SELECT * FROM audit_log WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(sessionId, limit);
}

function getAuditTrail({ limit = 200, customerId = null } = {}) {
  const database = getDb();
  if (customerId) {
    return database
      .prepare(`SELECT * FROM audit_log WHERE customer_id = ? ORDER BY created_at DESC LIMIT ?`)
      .all(customerId, limit);
  }
  return database.prepare(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?`).all(limit);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, logRecord, getRecentActionsForSession, getAuditTrail, closeDb };