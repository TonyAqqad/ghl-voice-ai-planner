#!/bin/bash
# Fix Context7 Integration Blockers
# Run this script to automatically fix all known blockers

set -e  # Exit on error

echo "🔧 Fixing Context7 Integration Blockers..."
echo ""

# 1. Fix vite permissions
echo "1️⃣ Fixing vite binary permissions..."
if [ -f "apps/web/node_modules/.bin/vite" ]; then
    chmod +x apps/web/node_modules/.bin/vite
    echo "   ✅ Vite permissions fixed"
else
    echo "   ⚠️  Vite binary not found - may need to run 'npm install' first"
fi
echo ""

# 2. Verify Tailwind is NOT being removed
echo "2️⃣ Verifying Tailwind dependencies..."
if grep -q "tailwindcss" apps/web/package.json; then
    echo "   ✅ Tailwind found in package.json (good!)"
else
    echo "   ❌ Tailwind missing from package.json (BAD - need to restore it)"
fi
echo ""

# 3. Check for MCP SDK
echo "3️⃣ Verifying MCP SDK dependency..."
if grep -q "@modelcontextprotocol/sdk" apps/server/package.json; then
    echo "   ✅ MCP SDK found (good!)"
else
    echo "   ⚠️  MCP SDK not found - may need to install it"
fi
echo ""

# 4. Verify Context7 environment variables
echo "4️⃣ Checking Context7 environment variables..."
if [ -f "apps/server/.env" ]; then
    if grep -q "CONTEXT7_API_KEY" apps/server/.env; then
        echo "   ✅ CONTEXT7_API_KEY found in .env"
    else
        echo "   ⚠️  CONTEXT7_API_KEY not found in .env"
        echo "      Add: CONTEXT7_API_KEY=your_key_here"
    fi
    
    if grep -q "CONTEXT7_BASE_URL" apps/server/.env; then
        echo "   ✅ CONTEXT7_BASE_URL found in .env"
    else
        echo "   ⚠️  CONTEXT7_BASE_URL not found in .env"
        echo "      Add: CONTEXT7_BASE_URL=https://context7.com/api"
    fi
    
    if grep -q "ENABLE_CONTEXT7_MEMORY" apps/server/.env; then
        echo "   ✅ ENABLE_CONTEXT7_MEMORY found in .env"
    else
        echo "   ℹ️  ENABLE_CONTEXT7_MEMORY not set (will default to false)"
    fi
else
    echo "   ⚠️  No .env file found at apps/server/.env"
    echo "      Copy apps/server/env.example to apps/server/.env"
fi
echo ""

# 5. Test build (optional - commented out for speed)
# echo "5️⃣ Testing build..."
# cd apps/web
# npm run build
# cd ../..
# echo "   ✅ Build successful"
# echo ""

echo "✅ Blocker check complete!"
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Run 'npm run build' to verify builds work"
echo "3. Follow CONTEXT7_CLEAN_DEPLOYMENT_PLAN.md"
echo ""

