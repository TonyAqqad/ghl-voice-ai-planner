// PostgreSQL database with Supabase
// Replaces in-memory storage with persistent database

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create connection pool with IPv4 and proper SSL configuration
const pool = new Pool({
  host: 'db.wkmnikcqijqboxwwfxle.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Sharmoota19!',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  // Connection timeout settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    throw error;
  }
}

/**
 * Store tokens
 */
async function storeTokens(tokensData, locationId = null, companyToken = null) {
  try {
    const expiresAt = Date.now() + 3600000; // 1 hour from now
    
    const result = await pool.query(
      `INSERT INTO tokens (access_token, refresh_token, expires_at, location_id, company_token)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tokensData.access_token, tokensData.refresh_token, expiresAt, locationId, companyToken || false]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error storing tokens:', error.message);
    throw error;
  }
}

/**
 * Get latest tokens
 */
async function getLatestTokens() {
  try {
    const result = await pool.query(
      'SELECT * FROM tokens ORDER BY created_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting latest tokens:', error.message);
    return null;
  }
}

/**
 * Get tokens for location
 */
async function getLocationTokens(locationId) {
  try {
    const result = await pool.query(
      'SELECT * FROM tokens WHERE location_id = $1 ORDER BY created_at DESC LIMIT 1',
      [locationId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting location tokens:', error.message);
    return null;
  }
}

/**
 * Store location token
 */
async function storeLocation(locationId, locationToken, name = null, companyId = null) {
  try {
    // Check if location exists
    const existing = await pool.query(
      'SELECT * FROM locations WHERE location_id = $1',
      [locationId]
    );
    
    if (existing.rows.length > 0) {
      // Update existing location
      const result = await pool.query(
        `UPDATE locations 
         SET location_token = $1, name = $2, company_id = $3, updated_at = CURRENT_TIMESTAMP
         WHERE location_id = $4
         RETURNING *`,
        [locationToken, name, companyId, locationId]
      );
      return result.rows[0];
    } else {
      // Insert new location
      const result = await pool.query(
        `INSERT INTO locations (location_id, location_token, name, company_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [locationId, locationToken, name, companyId]
      );
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error storing location:', error.message);
    throw error;
  }
}

/**
 * Get location token
 */
async function getLocation(locationId) {
  try {
    const result = await pool.query(
      'SELECT * FROM locations WHERE location_id = $1',
      [locationId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting location:', error.message);
    return null;
  }
}

/**
 * Get all locations
 */
async function getAllLocations() {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error getting all locations:', error.message);
    return [];
  }
}

/**
 * Update tokens
 */
async function updateTokens(id, tokensData) {
  try {
    const expiresAt = Date.now() + 3600000;
    const result = await pool.query(
      `UPDATE tokens 
       SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [tokensData.access_token, tokensData.refresh_token, expiresAt, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating tokens:', error.message);
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(expiresAt) {
  return new Date(expiresAt) < new Date();
}

// For compatibility with old code
const db = {
  serialize: (callback) => callback(),
  run: async (sql, params, callback) => {
    try {
      await pool.query(sql, params);
      if (callback) callback();
    } catch (error) {
      if (callback) callback(error);
    }
  },
  get: async (sql, params, callback) => {
    try {
      const result = await pool.query(sql, params);
      if (callback) callback(null, result.rows[0]);
    } catch (error) {
      if (callback) callback(error, null);
    }
  },
  all: async (sql, params, callback) => {
    try {
      const result = await pool.query(sql, params);
      if (callback) callback(null, result.rows);
    } catch (error) {
      if (callback) callback(error, []);
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  pool,
  initializeDatabase,
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
