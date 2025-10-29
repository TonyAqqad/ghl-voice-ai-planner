#!/usr/bin/env node

/**
 * Enhanced Database Connection Test for Render Deployment
 * Tests both local and production database connectivity
 */

const { Pool } = require('pg');
const dns = require('dns');

// Force IPv4-first DNS resolution
dns.setDefaultResultOrder?.('ipv4first');

console.log('🚀 Enhanced Database Connection Test');
console.log('=====================================\n');

// Test configurations
const configs = [
  {
    name: 'Transaction Pooler (Port 6543)',
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Emadaqqad46!@db.wkmnikcqijqboxwwfxle.pooler.supabase.co:6543/postgres',
    config: {
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Emadaqqad46!@db.wkmnikcqijqboxwwfxle.pooler.supabase.co:6543/postgres',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      family: 4
    }
  },
  {
    name: 'Session Pooler (Port 6543)',
    connectionString: 'postgresql://postgres:Emadaqqad46!@db.wkmnikcqijqboxwwfxle.supabase.co:6543/postgres',
    config: {
      connectionString: 'postgresql://postgres:Emadaqqad46!@db.wkmnikcqijqboxwwfxle.supabase.co:6543/postgres',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      family: 4
    }
  },
  {
    name: 'Direct Connection (Port 5432)',
    connectionString: 'postgresql://postgres:Emadaqqad46!@db.wkmnikcqijqboxwwfxle.supabase.co:5432/postgres',
    config: {
      connectionString: 'postgresql://postgres:Emadaqqad46!@db.wkmnikcqijqboxwwfxle.supabase.co:5432/postgres',
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
      family: 4
    }
  }
];

async function testConnection(config) {
  console.log(`🧪 Testing ${config.name}...`);
  
  try {
    const pool = new Pool(config.config);
    
    // Test basic connection
    const client = await pool.connect();
    console.log('   ✅ Connection established');
    
    // Test query
    const result = await client.query('SELECT now() as timestamp, version() as version');
    console.log(`   ✅ Query successful: ${result.rows[0].timestamp}`);
    
    // Test connection pool
    const poolStats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    console.log(`   📊 Pool stats:`, poolStats);
    
    client.release();
    await pool.end();
    
    console.log(`   ✅ ${config.name} - SUCCESS\n`);
    return true;
    
  } catch (error) {
    console.log(`   ❌ ${config.name} - FAILED`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}\n`);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Environment Variables:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   NODE_OPTIONS: ${process.env.NODE_OPTIONS || 'not set'}\n`);
  
  let successCount = 0;
  
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) successCount++;
  }
  
  console.log('📋 Test Summary:');
  console.log(`   Successful connections: ${successCount}/${configs.length}`);
  
  if (successCount > 0) {
    console.log('\n✅ At least one connection method works!');
    console.log('🚀 Ready for deployment to Render');
  } else {
    console.log('\n❌ All connection attempts failed');
    console.log('🔧 Please check:');
    console.log('   1. Supabase project is active');
    console.log('   2. Database password is correct');
    console.log('   3. Connection pooling is enabled');
    console.log('   4. Network connectivity');
  }
  
  console.log('\n📝 Recommended for Render:');
  console.log('   Use Transaction Pooler (port 6543) for best performance');
  console.log('   Set NODE_OPTIONS=--dns-result-order=ipv4first');
  console.log('   Use IPv4-only connection (family: 4)');
}

// Run tests
runTests().catch(console.error);
