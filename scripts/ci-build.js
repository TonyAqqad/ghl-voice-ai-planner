const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * CI Build Script - Multi-Method Permission-Safe
 * 
 * This script handles the build process with multiple fallback methods
 * to ensure builds succeed even with permission issues in CI/CD environments.
 */

function setExecutableForAllBins() {
  const binDir = path.resolve('node_modules/.bin');
  if (fs.existsSync(binDir)) {
    const files = fs.readdirSync(binDir);
    let count = 0;
    files.forEach(file => {
      try {
        const filePath = path.join(binDir, file);
        // Check if it's a file (not a directory/symlink issue)
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          fs.chmodSync(filePath, 0o755);
          count++;
        }
      } catch (err) {
        // Silently skip files that can't be chmod'd
      }
    });
    console.log(`✔ Set +x for ${count} binaries in node_modules/.bin/`);
    return count > 0;
  }
  console.log('⚠️  node_modules/.bin directory not found');
  return false;
}

function tryBuild(method, cmd) {
  console.log(`\n🔨 Attempting build method: ${method}`);
  console.log(`   Command: ${cmd}`);
  try {
    execSync(cmd, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    console.log(`\n✅ Build succeeded with: ${method}\n`);
    return true;
  } catch (err) {
    console.error(`\n❌ Build failed: ${method}`);
    console.error(`   Error: ${err.message || err}`);
    return false;
  }
}

function logEnv() {
  console.log('\n📊 Environment Information:');
  console.log(`   Node: ${process.version}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Architecture: ${process.arch}`);
  try {
    const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
    console.log(`   npm: ${npmVersion}`);
  } catch (e) {
    console.log(`   npm: Unable to detect`);
  }
  console.log(`   Working Directory: ${process.cwd()}\n`);
}

function verifyBuild() {
  const distPath = path.resolve('dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(distPath)) {
    console.error('\n❌ CRITICAL: dist folder was NOT created after build!');
    return false;
  }
  
  if (!fs.existsSync(indexPath)) {
    console.error('\n❌ CRITICAL: dist/index.html NOT found!');
    console.log('Dist contents:');
    try {
      const contents = fs.readdirSync(distPath);
      console.log(`   ${contents.slice(0, 10).join(', ')}${contents.length > 10 ? '...' : ''}`);
    } catch (e) {
      console.log('   (Cannot read dist directory)');
    }
    return false;
  }
  
  console.log('\n✅ Build verification passed!');
  console.log(`   Dist folder: ${distPath}`);
  console.log(`   index.html: ${indexPath}`);
  return true;
}

// Main execution
console.log('🚀 Starting CI Build Process...\n');

logEnv();
setExecutableForAllBins();

// Try build methods in order
const buildMethods = [
  { method: 'npm run build:actual', cmd: 'npm run build:actual -- --mode production' },
  { method: 'npx vite build', cmd: 'npx vite build --mode production' },
  { method: 'node direct vite.js', cmd: 'node ./node_modules/vite/bin/vite.js build --mode production' }
];

let buildSucceeded = false;
for (const { method, cmd } of buildMethods) {
  if (tryBuild(method, cmd)) {
    buildSucceeded = true;
    break;
  }
}

if (!buildSucceeded) {
  console.error('\n❌ All build methods failed!');
  console.error('\n📋 Troubleshooting Information:');
  
  // Check vite locations
  const viteLocations = [
    'node_modules/.bin/vite',
    'node_modules/vite/bin/vite.js',
    'node_modules/vite/dist/node/cli.js'
  ];
  
  console.log('\n   Checking vite locations:');
  viteLocations.forEach(loc => {
    const fullPath = path.resolve(loc);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        console.log(`   ✅ ${loc} - exists (${stat.size} bytes)`);
      } catch (e) {
        console.log(`   ⚠️  ${loc} - exists but cannot stat`);
      }
    } else {
      console.log(`   ❌ ${loc} - NOT FOUND`);
    }
  });
  
  // Show directory structure
  console.log('\n   Current directory contents:');
  try {
    const contents = fs.readdirSync(process.cwd()).slice(0, 15);
    contents.forEach(item => {
      const itemPath = path.join(process.cwd(), item);
      try {
        const stat = fs.statSync(itemPath);
        const type = stat.isDirectory() ? '📁' : '📄';
        console.log(`   ${type} ${item}`);
      } catch (e) {
        console.log(`   ❓ ${item}`);
      }
    });
  } catch (e) {
    console.log('   (Cannot read directory)');
  }
  
  process.exit(1);
}

// Verify the build output
if (!verifyBuild()) {
  process.exit(1);
}

console.log('\n🎉 Build completed successfully!\n');
process.exit(0);

