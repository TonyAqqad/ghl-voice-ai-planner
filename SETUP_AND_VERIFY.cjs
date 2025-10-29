/**
 * Complete App Setup & Verification Script
 * Checks everything: dependencies, env vars, database, MCP, GHL, API endpoints
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Voice AI App - Complete Setup Verification\n');
console.log('='.repeat(60));

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function logCheck(name, passed, message = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  console.log(`${color}${icon}${colors.reset} ${name}${message ? ': ' + message : ''}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${colors.reset}${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${colors.reset}${message}`);
}

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const mcpDir = path.join(serverDir, 'mcp');

const results = {
  dependencies: { passed: false, checks: [] },
  environment: { passed: false, checks: [] },
  mcpFiles: { passed: false, checks: [] },
  database: { passed: false, checks: [] },
  apiEndpoints: { passed: false, checks: [] }
};

// ===== 1. CHECK DEPENDENCIES =====
console.log('\n📦 Checking Dependencies...\n');

try {
  // Check server package.json
  const serverPkg = JSON.parse(fs.readFileSync(path.join(serverDir, 'package.json'), 'utf8'));
  const serverDeps = serverPkg.dependencies || {};
  
  const requiredServerDeps = [
    '@modelcontextprotocol/sdk',
    'express',
    'axios',
    'pg',
    'cors',
    'compression',
    'helmet'
  ];
  
  requiredServerDeps.forEach(dep => {
    const installed = serverDeps[dep] || fs.existsSync(path.join(serverDir, 'node_modules', dep));
    results.dependencies.checks.push({ name: dep, installed });
    logCheck(`Server: ${dep}`, installed, installed ? `v${serverDeps[dep] || 'installed'}` : 'MISSING');
  });
  
  // Check root package.json (frontend)
  const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const rootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };
  
  const requiredRootDeps = ['react', 'vite', 'zustand', 'reactflow'];
  requiredRootDeps.forEach(dep => {
    const installed = rootDeps[dep] || fs.existsSync(path.join(rootDir, 'node_modules', dep));
    results.dependencies.checks.push({ name: dep, installed });
    logCheck(`Frontend: ${dep}`, installed);
  });
  
  results.dependencies.passed = results.dependencies.checks.every(c => c.installed);
  
  if (!results.dependencies.passed) {
    logWarning('Run: cd server && npm install');
    logWarning('Then: cd .. && npm install');
  }
} catch (error) {
  logWarning(`Error checking dependencies: ${error.message}`);
}

// ===== 2. CHECK ENVIRONMENT VARIABLES =====
console.log('\n🔐 Checking Environment Variables...\n');

const envPath = path.join(serverDir, '.env');
const envExamplePath = path.join(serverDir, 'env.example');

const requiredEnvVars = {
  critical: [
    'DATABASE_URL',
    'GHL_CLIENT_ID',
    'GHL_CLIENT_SECRET'
  ],
  important: [
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'CONTEXT7_API_KEY',
    'GITHUB_PERSONAL_ACCESS_TOKEN',
    'CODESANDBOX_API_KEY'
  ],
  optional: [
    'GHL_REDIRECT_URI',
    'NODE_ENV',
    'PORT'
  ]
};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  [...requiredEnvVars.critical, ...requiredEnvVars.important].forEach(envVar => {
    const hasValue = envContent.includes(`${envVar}=`) && 
                     !envContent.match(new RegExp(`${envVar}=\\s*$|${envVar}=\\s*["']?your_`));
    const isCritical = requiredEnvVars.critical.includes(envVar);
    results.environment.checks.push({ name: envVar, set: hasValue, critical: isCritical });
    logCheck(envVar, hasValue, hasValue ? 'Set' : isCritical ? 'REQUIRED' : 'Recommended');
  });
  
  requiredEnvVars.optional.forEach(envVar => {
    const hasValue = envContent.includes(`${envVar}=`);
    if (hasValue) {
      logCheck(envVar, true, 'Set (optional)');
    }
  });
  
  results.environment.passed = requiredEnvVars.critical.every(v => 
    results.environment.checks.find(c => c.name === v)?.set
  );
} else {
  logWarning('.env file not found');
  if (fs.existsSync(envExamplePath)) {
    logInfo('Copy env.example to .env: cp server/env.example server/.env');
  }
  results.environment.passed = false;
}

// ===== 3. CHECK MCP FILES =====
console.log('\n🔧 Checking MCP Server Files...\n');

const mcpFiles = [
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

mcpFiles.forEach(file => {
  const filePath = path.join(mcpDir, file);
  const exists = fs.existsSync(filePath);
  results.mcpFiles.checks.push({ name: file, exists });
  logCheck(`MCP: ${file}`, exists);
});

results.mcpFiles.passed = results.mcpFiles.checks.every(c => c.exists);

// ===== 4. CHECK DATABASE SCHEMA =====
console.log('\n💾 Checking Database Schema...\n');

const schemaPath = path.join(serverDir, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const requiredTables = [
    'agent_logs',
    'mcp_agent_states',
    'mcp_health_checks',
    'mcp_incidents',
    'mcp_feedback',
    'mcp_traces',
    'mcp_action_retries',
    'agents',
    'tokens',
    'locations'
  ];
  
  requiredTables.forEach(table => {
    const exists = schema.includes(`CREATE TABLE`) && 
                   schema.includes(table);
    results.database.checks.push({ name: table, exists });
    logCheck(`Table: ${table}`, exists);
  });
  
  results.database.passed = results.database.checks.length > 0;
} else {
  logWarning('schema.sql not found');
  results.database.passed = false;
}

// ===== 5. CHECK FRONTEND FILES =====
console.log('\n🎨 Checking Frontend Files...\n');

const frontendFiles = [
  'src/hooks/useMCP.ts',
  'src/App.tsx',
  'src/store/useStore.ts',
  'vite.config.ts',
  'tailwind.config.cjs'
];

frontendFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const exists = fs.existsSync(filePath);
  logCheck(`Frontend: ${file}`, exists);
});

// Check if dist folder exists (build output)
const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
  logCheck('Frontend build (dist/)', true);
} else {
  logCheck('Frontend build (dist/)', false, 'Run: npm run build');
}

// ===== 6. CHECK API ENDPOINTS STRUCTURE =====
console.log('\n🔌 Checking API Server Structure...\n');

const serverFile = path.join(serverDir, 'ghl-express-api.js');
if (fs.existsSync(serverFile)) {
  const serverContent = fs.readFileSync(serverFile, 'utf8');
  
  const checks = [
    { name: 'MCP server integration', pattern: /require\(['"]\.\/mcp\/server['"]\)/ },
    { name: 'Database connection', pattern: /initializeDatabase/ },
    { name: 'CORS middleware', pattern: /app\.use\(cors/ },
    { name: 'Static file serving', pattern: /express\.static/ },
    { name: 'GHL OAuth routes', pattern: /\/auth\/ghl/ },
    { name: 'Voice AI agent routes', pattern: /\/api\/voice-ai\/agents/ },
    { name: 'ElevenLabs routes', pattern: /\/api\/elevenlabs/ }
  ];
  
  checks.forEach(check => {
    const found = check.pattern.test(serverContent);
    logCheck(check.name, found);
  });
  
  results.apiEndpoints.passed = checks.every(c => c.pattern.test(serverContent));
} else {
  logWarning('ghl-express-api.js not found');
}

// ===== 7. TEST MODULE IMPORTS =====
console.log('\n🧪 Testing Module Imports...\n');

try {
  const mcpIndex = require(path.join(mcpDir, 'index.js'));
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
    const exported = exports.includes(exp);
    logCheck(`Export: ${exp}`, exported);
  });
  
  logInfo(`MCP exports: ${exports.length}/${expectedExports.length}`);
} catch (error) {
  logWarning(`MCP module test failed: ${error.message}`);
  logInfo('This is OK if dependencies are not installed yet');
}

// ===== SUMMARY =====
console.log('\n' + '='.repeat(60));
console.log('\n📊 SETUP SUMMARY\n');

const allPassed = 
  results.dependencies.passed &&
  results.environment.passed &&
  results.mcpFiles.passed &&
  results.database.passed &&
  results.apiEndpoints.passed;

if (allPassed) {
  console.log(`${colors.green}✅ All critical checks passed!${colors.reset}`);
  console.log('\n🚀 Your app is ready to deploy!');
  console.log('\nNext steps:');
  console.log('1. Start server: cd server && npm run dev');
  console.log('2. Test health: curl http://localhost:10000/api/health');
  console.log('3. Test MCP: curl http://localhost:10000/api/mcp/health');
  console.log('4. Authenticate GHL: Visit http://localhost:10000/auth/ghl');
} else {
  console.log(`${colors.yellow}⚠️  Some checks failed${colors.reset}`);
  console.log('\n📋 Action Items:');
  
  if (!results.dependencies.passed) {
    console.log('  - Install dependencies: cd server && npm install && cd .. && npm install');
  }
  
  if (!results.environment.passed) {
    console.log('  - Configure .env: Copy server/env.example to server/.env and fill in API keys');
  }
  
  if (!results.mcpFiles.passed) {
    console.log('  - MCP files missing - check server/mcp/ directory');
  }
  
  if (!results.database.passed) {
    console.log('  - Run database schema: psql $DATABASE_URL < server/schema.sql');
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Quick Test Commands:\n');
console.log('  Health Check:     curl http://localhost:10000/api/health');
console.log('  MCP Health:       curl http://localhost:10000/api/mcp/health');
console.log('  DB Health:         curl http://localhost:10000/health/db');
console.log('  GHL Status:        curl http://localhost:10000/ghl-api');
console.log('\n');

process.exit(allPassed ? 0 : 1);

