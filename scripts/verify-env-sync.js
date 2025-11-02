#!/usr/bin/env node
// Verifies that API keys referenced in ~/.cursor/mcp.json are present in process.env
const fs = require('fs')
const os = require('os')
const path = require('path')

function readMcpJson() {
  const p = path.join(os.homedir(), '.cursor', 'mcp.json')
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (e) {
    console.error('Unable to read', p, e.message)
    process.exit(1)
  }
}

function collectEnvRefs(obj, acc = new Set()) {
  if (!obj || typeof obj !== 'object') return acc
  for (const [, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      const m = v.match(/\$\{([A-Z0-9_]+)\}/)
      if (m) acc.add(m[1])
    } else if (typeof v === 'object') {
      collectEnvRefs(v, acc)
    }
  }
  return acc
}

const cfg = readMcpJson()
const refs = collectEnvRefs(cfg)
const missing = []
for (const name of refs) {
  if (!process.env[name] || process.env[name].trim() === '') missing.push(name)
}

if (missing.length) {
  console.error('Missing environment variables for mcp.json:', missing.join(', '))
  process.exitCode = 2
} else {
  console.log('All referenced variables in mcp.json are present in environment.')
}