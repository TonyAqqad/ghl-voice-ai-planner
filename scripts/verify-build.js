#!/usr/bin/env node

/**
 * Build Verification Script
 * Ensures dist folder exists and contains necessary files
 * Uses CommonJS for compatibility
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(process.cwd(), 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log('🔍 Verifying build output...');
console.log(`📁 Current directory: ${process.cwd()}`);
console.log(`📁 Dist path: ${distPath}`);

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist folder does not exist!');
  console.error('   Build may have failed. Check build logs above.');
  process.exit(1);
}

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: index.html not found in dist folder!');
  process.exit(1);
}

const distContents = fs.readdirSync(distPath);
console.log(`✅ dist folder exists`);
console.log(`✅ index.html found`);
console.log(`📦 Dist contents (${distContents.length} items):`);
distContents.forEach((item, idx) => {
  const itemPath = path.join(distPath, item);
  const stats = fs.statSync(itemPath);
  const size = stats.isDirectory() ? '[DIR]' : `${(stats.size / 1024).toFixed(2)} KB`;
  console.log(`   ${idx + 1}. ${item} (${size})`);
});

console.log('\n✅ Build verification successful!');
process.exit(0);

