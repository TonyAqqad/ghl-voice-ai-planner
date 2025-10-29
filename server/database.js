// PostgreSQL database with Supabase
// Replaces in-memory storage with persistent database

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create connection pool with enhanced configuration for production
const createPool = () => {
  try {
    const config = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },     // Supabase requires SSL
      max: 10,                                 // pooled connections (transaction pooler)
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      // Force IPv4 to avoid ENETUNREACH errors
      family: 4
    };

    // Parse connection string for additional config
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        config.host = url.hostname;
        config.port = parseInt(url.port) || 5432;
        config.database = url.pathname.substring(1);
        config.user = url.username;
        config.password = url.password;
        
        // Log connection details for debugging
        console.log('🔗 Database connection config:');
        console.log(`   Host: ${config.host}`);
        console.log(`   Port: ${config.port}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   User: ${config.user}`);
        console.log(`   IPv4 Only: ${config.family === 4 ? 'Yes' : 'No'}`);
        
        // Warn if using direct connection instead of pooler
        if (config.port === 5432) {
          console.log('⚠️  WARNING: Using direct connection (port 5432). Consider using Transaction Pooler (port 6543) for better performance.');
        } else if (config.port === 6543) {
          console.log('✅ Using Transaction Pooler (port 6543) - Recommended for production');
        }
        
      } catch (urlError) {
        console.log('Using connection string directly');
      }
    }

    return new Pool(config);
  } catch (error) {
    console.error('Failed to create database pool:', error.message);
    throw error;
  }
};

// Initialize pool safely - handle initialization errors gracefully
let pool;
try {
  pool = createPool();
  console.log('✅ Database pool created successfully');
} catch (error) {
  console.error('❌ Failed to initialize database pool:', error.message);
  console.error('   The application will continue but database features will be unavailable');
  // Create a mock pool object to prevent crashes
  pool = {
    query: async () => { throw new Error('Database pool not initialized'); },
    connect: async () => { throw new Error('Database pool not initialized'); },
    end: async () => { console.log('⚠️  Pool not initialized, skipping cleanup'); }
  };
}

// Initialize database tables with retry logic
async function initializeDatabase() {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Initializing database... (attempt ${attempt}/${maxRetries})`);
      
      // Test connection first with timeout
      const client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      console.log('✅ Database connection established');
      
      // Check if tables already exist
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log(`📊 Found ${tablesResult.rows.length} existing tables`);
      
      if (tablesResult.rows.length === 0) {
        console.log('📝 Creating database schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
          throw new Error(`Schema file not found: ${schemaPath}`);
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        console.log('✅ Database schema created successfully');
      } else {
        console.log('✅ Database schema already exists');
      }
      
      client.release();
      console.log('✅ Database initialization completed');
      return; // Success, exit retry loop
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Database initialization error (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${attempt * 2000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  
  console.error('❌ Database initialization failed after all retries');
  console.error('   This might be due to:');
  console.error('   - Network connectivity issues');
  console.error('   - Supabase service being down');
  console.error('   - Incorrect DATABASE_URL');
  console.error('   - Firewall blocking the connection');
  
  // Don't throw error in production, just log it
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Continuing without database connection (production mode)');
    return;
  }
  
  throw lastError;
}

/**
 * Store tokens with retry logic
 */
async function storeTokens(tokensData, locationId = null, companyToken = null) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const expiresAt = Date.now() + 3600000; // 1 hour from now
      
      const result = await pool.query(
        `INSERT INTO tokens (access_token, refresh_token, expires_at, location_id, company_token)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [tokensData.access_token, tokensData.refresh_token, expiresAt, locationId, companyToken || false]
      );
      
      console.log(`✅ Tokens stored successfully (attempt ${attempt})`);
      return result.rows[0];
    } catch (error) {
      lastError = error;
      console.error(`❌ Error storing tokens (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  
  console.error('❌ Failed to store tokens after all retries');
  throw lastError;
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
  try {
    if (pool && typeof pool.end === 'function') {
      await pool.end();
      console.log('✅ Database pool closed successfully');
    } else {
      console.log('⚠️  Database pool not initialized, skipping cleanup');
    }
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database pool...');
  try {
    if (pool && typeof pool.end === 'function') {
      await pool.end();
      console.log('✅ Database pool closed successfully');
    } else {
      console.log('⚠️  Database pool not initialized, skipping cleanup');
    }
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
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
