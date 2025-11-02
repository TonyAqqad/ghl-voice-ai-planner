/**
 * MCP Server Setup Script
 * Run this to verify MCP server setup and dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 MCP Server Setup Verification\n');

// Check if required files exist
const requiredFiles = [
  'server.js',
  'index.js',
  'primitives/voiceAgent.js',
  'primitives/ghl.js',
  'primitives/webhook.js',
  'primitives/contact.js',
  'primitives/action.js',
  'primitives/agent.js',
  'primitives/integration.js',
  'monitoring/autoRecovery.js',
  'monitoring/anomalyDetection.js',
  'monitoring/feedbackLoop.js',
  'monitoring/configDrift.js',
  'monitoring/liveTrace.js',
  'monitoring/autoPatch.js',
  'monitoring/incidentReport.js'
];

let allFilesExist = true;
const mcpDir = __dirname;

console.log('Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(mcpDir, file);
  const exists = fs.existsSync(filePath);
  if (exists) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check if database schema has MCP tables
console.log('\nChecking database schema...');
const schemaPath = path.join(__dirname, '..', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const requiredTables = [
    'agent_logs',
    'mcp_agent_states',
    'mcp_health_checks',
    'mcp_incidents',
    'mcp_feedback',
    'mcp_traces',
    'mcp_action_retries'
  ];

  requiredTables.forEach(table => {
    if (schema.includes(`CREATE TABLE.*${table}`) || schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
      console.log(`  ✅ Table: ${table}`);
    } else {
      console.log(`  ⚠️  Table: ${table} - Not found in schema`);
    }
  });
} else {
  console.log('  ⚠️  schema.sql not found');
}

// Check dependencies
console.log('\nChecking dependencies...');
try {
  const packageJson = require(path.join(__dirname, '..', 'package.json'));
  if (packageJson.dependencies && packageJson.dependencies['@modelcontextprotocol/sdk']) {
    console.log('  ✅ @modelcontextprotocol/sdk');
  } else {
    console.log('  ❌ @modelcontextprotocol/sdk - Not in package.json');
    console.log('     Run: npm install @modelcontextprotocol/sdk');
  }
} catch (error) {
  console.log('  ⚠️  Could not check package.json');
}

// Check environment variables
console.log('\nChecking environment variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'ELEVENLABS_API_KEY',
  'OPENAI_API_KEY'
];

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`  ✅ ${envVar}`);
    } else {
      console.log(`  ⚠️  ${envVar} - Not set in .env`);
    }
  });
} else {
  console.log('  ⚠️  .env file not found');
  console.log('     Copy env.example to .env and configure');
}

// Test module imports
console.log('\nTesting module imports...');
try {
  const mcpIndex = require('./index');
  const exports = Object.keys(mcpIndex);
  const expectedExports = [
    'VoiceAgentPrimitive',
    'GHLPrimitive',
    'WebhookPrimitive',
    'ContactPrimitive',
    'ActionPrimitive',
    'AgentPrimitive',
    'IntegrationPrimitive',
    'AutoRecoveryPrimitive',
    'AnomalyDetectionPrimitive',
    'FeedbackLoopPrimitive',
    'ConfigDriftPrimitive',
    'LiveTracePrimitive',
    'AutoPatchPrimitive',
    'IncidentReportPrimitive'
  ];

  expectedExports.forEach(exp => {
    if (exports.includes(exp)) {
      console.log(`  ✅ ${exp}`);
    } else {
      console.log(`  ❌ ${exp} - Not exported`);
    }
  });
} catch (error) {
  console.log(`  ❌ Error importing modules: ${error.message}`);
}

// Test server router
console.log('\nTesting Express router...');
try {
  const router = require('./server');
  if (router && typeof router === 'function') {
    console.log('  ✅ MCP server router loaded');
  } else {
    console.log('  ❌ MCP server router invalid');
  }
} catch (error) {
  console.log(`  ❌ Error loading server router: ${error.message}`);
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ MCP Server setup appears complete!');
  console.log('\nNext steps:');
  console.log('1. Run database migrations: psql $DATABASE_URL < ../schema.sql');
  console.log('2. Install dependencies: npm install');
  console.log('3. Configure .env file with API keys');
  console.log('4. Start server: npm run server:dev');
  console.log('5. Test endpoint: curl http://localhost:10000/api/mcp/health');
} else {
  console.log('⚠️  Some files are missing. Please review above.');
}
console.log('='.repeat(50));

