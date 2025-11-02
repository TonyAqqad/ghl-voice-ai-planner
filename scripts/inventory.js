#!/usr/bin/env node

/**
 * Repository Inventory Generator
 * Scans the monorepo and generates INVENTORY.md and inventory.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT, 'apps');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const DOCS_DIR = path.join(ROOT, 'docs');

// Ensure docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

const inventory = {
  generatedAt: new Date().toISOString(),
  overview: {
    name: 'GHL Voice AI Builder',
    type: 'monorepo',
    structure: 'npm workspaces'
  },
  apps: [],
  packages: [],
  routes: [],
  envVars: [],
  buildCommands: {},
  deployment: {}
};

// Scan apps
function scanApps() {
  const apps = fs.readdirSync(APPS_DIR);
  
  apps.forEach(app => {
    const appPath = path.join(APPS_DIR, app);
    if (!fs.statSync(appPath).isDirectory()) return;
    
    const pkgPath = path.join(appPath, 'package.json');
    let packageInfo = {};
    
    if (fs.existsSync(pkgPath)) {
      packageInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    }
    
    const appInfo = {
      name: app,
      path: `apps/${app}`,
      language: app === 'web' ? 'TypeScript' : 'JavaScript',
      framework: app === 'web' ? 'React + Vite' : 'Express.js',
      description: packageInfo.description || 'No description',
      scripts: packageInfo.scripts || {}
    };
    
    inventory.apps.push(appInfo);
    
    // Scan for Express routes if server app
    if (app === 'server') {
      scanExpressRoutes(appPath);
    }
    
    // Scan for env vars
    scanEnvVars(appPath, `apps/${app}`);
  });
}

// Scan packages
function scanPackages() {
  if (!fs.existsSync(PACKAGES_DIR)) return;
  
  const packages = fs.readdirSync(PACKAGES_DIR);
  
  packages.forEach(pkg => {
    const pkgPath = path.join(PACKAGES_DIR, pkg);
    if (!fs.statSync(pkgPath).isDirectory()) return;
    
    const packageJsonPath = path.join(pkgPath, 'package.json');
    let packageInfo = {};
    
    if (fs.existsSync(packageJsonPath)) {
      packageInfo = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
    
    inventory.packages.push({
      name: pkg,
      path: `packages/${pkg}`,
      language: 'TypeScript',
      description: packageInfo.description || 'No description',
      version: packageInfo.version || '0.0.0'
    });
  });
}

// Scan for Express routes
function scanExpressRoutes(serverPath) {
  const routePatterns = [
    /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
  ];
  
  function scanFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      routePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          inventory.routes.push({
            method: match[1].toUpperCase(),
            path: match[2],
            file: relativePath
          });
        }
      });
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  function walkDir(dir, baseDir = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const relativePath = path.join(baseDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && file !== 'node_modules') {
        walkDir(fullPath, relativePath);
      } else if (file.endsWith('.js')) {
        scanFile(fullPath, `apps/server/${relativePath}`);
      }
    });
  }
  
  walkDir(serverPath);
}

// Scan for environment variables
function scanEnvVars(appPath, appName) {
  const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  
  function scanFile(filePath, relativePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let match;
      
      while ((match = envPattern.exec(content)) !== null) {
        const varName = match[1];
        const existing = inventory.envVars.find(v => v.name === varName);
        
        if (existing) {
          if (!existing.usedIn.includes(relativePath)) {
            existing.usedIn.push(relativePath);
          }
        } else {
          inventory.envVars.push({
            name: varName,
            usedIn: [relativePath],
            purpose: guessPurpose(varName)
          });
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }
  
  function walkDir(dir, baseDir = '') {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const relativePath = path.join(baseDir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
          walkDir(fullPath, relativePath);
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
          scanFile(fullPath, `${appName}/${relativePath}`);
        }
      });
    } catch (err) {
      // Skip directories that can't be read
    }
  }
  
  walkDir(appPath);
}

function guessPurpose(varName) {
  const purposes = {
    'PORT': 'Server port',
    'NODE_ENV': 'Environment mode',
    'DATABASE_URL': 'Database connection',
    'GHL_CLIENT_ID': 'GHL OAuth client ID',
    'GHL_CLIENT_SECRET': 'GHL OAuth secret',
    'GHL_SHARED_SECRET': 'GHL webhook secret',
    'FRONTEND_DIST_PATH': 'Frontend build output path',
    'GHL_REDIRECT_URI': 'OAuth redirect URL'
  };
  
  return purposes[varName] || 'Unknown';
}

// Read render.yaml
function scanDeployment() {
  const renderPath = path.join(ROOT, 'render.yaml');
  
  if (fs.existsSync(renderPath)) {
    const renderConfig = fs.readFileSync(renderPath, 'utf8');
    inventory.deployment = {
      platform: 'Render.com',
      configFile: 'render.yaml',
      buildCommand: 'npm ci && npm run build',
      startCommand: 'node apps/server/ghl-express-api.js'
    };
  }
}

// Generate Markdown
function generateMarkdown() {
  let md = `# Repository Inventory\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;
  
  md += `## Overview\n\n`;
  md += `- **Name:** ${inventory.overview.name}\n`;
  md += `- **Type:** ${inventory.overview.type}\n`;
  md += `- **Structure:** ${inventory.overview.structure}\n\n`;
  
  md += `## Apps & Packages\n\n`;
  md += `### Applications\n\n`;
  md += `| Name | Path | Language | Framework | Description |\n`;
  md += `|------|------|----------|-----------|-------------|\n`;
  inventory.apps.forEach(app => {
    md += `| ${app.name} | ${app.path} | ${app.language} | ${app.framework} | ${app.description} |\n`;
  });
  md += `\n`;
  
  if (inventory.packages.length > 0) {
    md += `### Packages\n\n`;
    md += `| Name | Path | Language | Description |\n`;
    md += `|------|------|----------|-------------|\n`;
    inventory.packages.forEach(pkg => {
      md += `| ${pkg.name} | ${pkg.path} | ${pkg.language} | ${pkg.description} |\n`;
    });
    md += `\n`;
  }
  
  if (inventory.routes.length > 0) {
    md += `## Express Routes (Server)\n\n`;
    md += `| Method | Path | File |\n`;
    md += `|--------|------|------|\n`;
    inventory.routes.forEach(route => {
      md += `| ${route.method} | ${route.path} | ${route.file} |\n`;
    });
    md += `\n`;
  }
  
  if (inventory.envVars.length > 0) {
    md += `## Environment Variables\n\n`;
    md += `| Variable | Purpose | Used In |\n`;
    md += `|----------|---------|---------|\ n`;
    inventory.envVars.forEach(envVar => {
      const files = envVar.usedIn.length > 3 
        ? `${envVar.usedIn.slice(0, 3).join(', ')}... (${envVar.usedIn.length} files)`
        : envVar.usedIn.join(', ');
      md += `| ${envVar.name} | ${envVar.purpose} | ${files} |\n`;
    });
    md += `\n`;
  }
  
  md += `## Build & Deployment\n\n`;
  md += `**Platform:** ${inventory.deployment.platform}\n\n`;
  md += `**Build Command:**\n\`\`\`bash\n${inventory.deployment.buildCommand}\n\`\`\`\n\n`;
  md += `**Start Command:**\n\`\`\`bash\n${inventory.deployment.startCommand}\n\`\`\`\n\n`;
  
  md += `## Risk Assessment\n\n`;
  md += `- **Duplicate Routes:** ${checkDuplicateRoutes()}\n`;
  md += `- **Missing Env Vars:** Check that all env vars are set in Render dashboard\n`;
  md += `- **Build Dependencies:** Ensure npm ci runs successfully\n\n`;
  
  return md;
}

function checkDuplicateRoutes() {
  const routeKeys = inventory.routes.map(r => `${r.method}:${r.path}`);
  const duplicates = routeKeys.filter((item, index) => routeKeys.indexOf(item) !== index);
  return duplicates.length > 0 ? `Found ${duplicates.length} duplicate(s)` : 'None detected';
}

// Main execution
console.log('🔍 Scanning repository...\n');

scanApps();
scanPackages();
scanDeployment();

console.log(`✅ Found ${inventory.apps.length} apps`);
console.log(`✅ Found ${inventory.packages.length} packages`);
console.log(`✅ Found ${inventory.routes.length} routes`);
console.log(`✅ Found ${inventory.envVars.length} environment variables\n`);

console.log('📝 Generating inventory files...\n');

const markdown = generateMarkdown();
fs.writeFileSync(path.join(DOCS_DIR, 'INVENTORY.md'), markdown);
console.log('✅ Created docs/INVENTORY.md');

fs.writeFileSync(path.join(DOCS_DIR, 'inventory.json'), JSON.stringify(inventory, null, 2));
console.log('✅ Created docs/inventory.json');

console.log('\n✨ Inventory generation complete!');

