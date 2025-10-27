const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'tokens.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    location_id TEXT,
    company_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id TEXT NOT NULL UNIQUE,
    location_token TEXT NOT NULL,
    name TEXT,
    company_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Store tokens in database
 */
function storeTokens(tokens, locationId = null, companyToken = null) {
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  
  const stmt = db.prepare(`
    INSERT INTO tokens (access_token, refresh_token, expires_at, location_id, company_token)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    tokens.access_token,
    tokens.refresh_token,
    expiresAt,
    locationId,
    companyToken
  );
}

/**
 * Get latest tokens
 */
function getLatestTokens() {
  const stmt = db.prepare(`
    SELECT * FROM tokens 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  
  return stmt.get();
}

/**
 * Get tokens for location
 */
function getLocationTokens(locationId) {
  const stmt = db.prepare(`
    SELECT * FROM tokens 
    WHERE location_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  
  return stmt.get(locationId);
}

/**
 * Store location token
 */
function storeLocation(locationId, locationToken, name = null, companyId = null) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO locations (location_id, location_token, name, company_id)
    VALUES (?, ?, ?, ?)
  `);
  
  return stmt.run(locationId, locationToken, name, companyId);
}

/**
 * Get location token
 */
function getLocation(locationId) {
  const stmt = db.prepare('SELECT * FROM locations WHERE location_id = ?');
  return stmt.get(locationId);
}

/**
 * Get all locations
 */
function getAllLocations() {
  const stmt = db.prepare('SELECT * FROM locations ORDER BY created_at DESC');
  return stmt.all();
}

/**
 * Update tokens
 */
function updateTokens(id, tokens) {
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  
  const stmt = db.prepare(`
    UPDATE tokens 
    SET access_token = ?, 
        refresh_token = ?, 
        expires_at = ?, 
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  return stmt.run(tokens.access_token, tokens.refresh_token, expiresAt, id);
}

/**
 * Check if token is expired
 */
function isTokenExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

module.exports = {
  storeTokens,
  getLatestTokens,
  getLocationTokens,
  storeLocation,
  getLocation,
  getAllLocations,
  updateTokens,
  isTokenExpired,
  db
};

