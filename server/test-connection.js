/**
 * Database Connection Test Utility
 * Tests database connectivity and provides diagnostic information
 */

const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📊 Connection details:');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    return false;
  }
  
  // Parse connection string for diagnostics
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port}`);
    console.log(`   Database: ${url.pathname.substring(1)}`);
    console.log(`   User: ${url.username}`);
    console.log(`   SSL: Required`);
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    return false;
  }
  
  // Test different connection configurations
  const configs = [
    {
      name: 'Standard Configuration',
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'IPv4 Force Configuration',
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        // Force IPv4 by resolving hostname
        host: new URL(process.env.DATABASE_URL).hostname,
        port: parseInt(new URL(process.env.DATABASE_URL).port),
        connectionTimeoutMillis: 10000
      }
    }
  ];
  
  for (const { name, config } of configs) {
    console.log(`\n🧪 Testing ${name}...`);
    
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      console.log('✅ Connection successful!');
      
      // Test a simple query
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log(`   Current time: ${result.rows[0].current_time}`);
      console.log(`   PostgreSQL version: ${result.rows[0].pg_version}`);
      
      // Test table existence
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log(`   Tables found: ${tablesResult.rows.length}`);
      if (tablesResult.rows.length > 0) {
        console.log(`   Table names: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);
      }
      
      client.release();
      await pool.end();
      
      console.log('✅ All tests passed!');
      return true;
      
    } catch (error) {
      console.error(`❌ Connection failed:`, error.message);
      console.error(`   Error code: ${error.code}`);
      console.error(`   Error detail: ${error.detail || 'No additional details'}`);
      
      try {
        await pool.end();
      } catch (endError) {
        console.error('   Pool cleanup error:', endError.message);
      }
    }
  }
  
  console.log('\n❌ All connection attempts failed');
  return false;
}

// Network diagnostics
async function networkDiagnostics() {
  console.log('\n🌐 Network Diagnostics:');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const url = new URL(process.env.DATABASE_URL);
    const hostname = url.hostname;
    
    console.log(`   Testing connectivity to ${hostname}...`);
    
    // Test ping (Windows)
    try {
      const { stdout } = await execAsync(`ping -n 1 ${hostname}`);
      console.log('   ✅ Ping successful');
    } catch (pingError) {
      console.log('   ❌ Ping failed:', pingError.message);
    }
    
    // Test telnet to port
    try {
      const { stdout } = await execAsync(`powershell "Test-NetConnection -ComputerName ${hostname} -Port ${url.port}"`);
      console.log('   ✅ Port connectivity test completed');
    } catch (telnetError) {
      console.log('   ❌ Port test failed:', telnetError.message);
    }
    
  } catch (error) {
    console.error('   Network diagnostics error:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 GHL Voice AI Database Connection Test\n');
  
  const connectionSuccess = await testDatabaseConnection();
  await networkDiagnostics();
  
  console.log('\n📋 Recommendations:');
  
  if (!connectionSuccess) {
    console.log('1. Check your internet connection');
    console.log('2. Verify Supabase project is active');
    console.log('3. Check firewall settings');
    console.log('4. Try using a VPN if IPv6 issues persist');
    console.log('5. Contact Supabase support if problem continues');
  } else {
    console.log('✅ Database connection is working properly!');
  }
  
  console.log('\n🔧 Environment Variables Check:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
  console.log(`   GHL_CLIENT_ID: ${process.env.GHL_CLIENT_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`   GHL_CLIENT_SECRET: ${process.env.GHL_CLIENT_SECRET ? '✅ Set' : '❌ Not set'}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testDatabaseConnection, networkDiagnostics };
