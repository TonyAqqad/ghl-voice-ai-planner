# Fix Context7 Integration Blockers (Windows PowerShell)
# Run this script to automatically fix all known blockers

Write-Host "🔧 Fixing Context7 Integration Blockers..." -ForegroundColor Cyan
Write-Host ""

# 1. Fix vite permissions (Windows doesn't need this, but check it exists)
Write-Host "1️⃣ Checking vite binary..." -ForegroundColor Yellow
if (Test-Path "apps\web\node_modules\.bin\vite") {
    Write-Host "   ✅ Vite binary found" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Vite binary not found - may need to run 'npm install' first" -ForegroundColor Red
}
Write-Host ""

# 2. Verify Tailwind is NOT being removed
Write-Host "2️⃣ Verifying Tailwind dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "apps\web\package.json" -Raw
if ($packageJson -match "tailwindcss") {
    Write-Host "   ✅ Tailwind found in package.json (good!)" -ForegroundColor Green
} else {
    Write-Host "   ❌ Tailwind missing from package.json (BAD - need to restore it)" -ForegroundColor Red
}
Write-Host ""

# 3. Check for MCP SDK
Write-Host "3️⃣ Verifying MCP SDK dependency..." -ForegroundColor Yellow
$serverPackageJson = Get-Content "apps\server\package.json" -Raw
if ($serverPackageJson -match "@modelcontextprotocol/sdk") {
    Write-Host "   ✅ MCP SDK found (good!)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  MCP SDK not found - may need to install it" -ForegroundColor Red
}
Write-Host ""

# 4. Verify Context7 environment variables
Write-Host "4️⃣ Checking Context7 environment variables..." -ForegroundColor Yellow
if (Test-Path "apps\server\.env") {
    $envContent = Get-Content "apps\server\.env" -Raw
    
    if ($envContent -match "CONTEXT7_API_KEY") {
        Write-Host "   ✅ CONTEXT7_API_KEY found in .env" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CONTEXT7_API_KEY not found in .env" -ForegroundColor Yellow
        Write-Host "      Add: CONTEXT7_API_KEY=your_key_here" -ForegroundColor Gray
    }
    
    if ($envContent -match "CONTEXT7_BASE_URL") {
        Write-Host "   ✅ CONTEXT7_BASE_URL found in .env" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CONTEXT7_BASE_URL not found in .env" -ForegroundColor Yellow
        Write-Host "      Add: CONTEXT7_BASE_URL=https://context7.com/api" -ForegroundColor Gray
    }
    
    if ($envContent -match "ENABLE_CONTEXT7_MEMORY") {
        Write-Host "   ✅ ENABLE_CONTEXT7_MEMORY found in .env" -ForegroundColor Green
    } else {
        Write-Host "   ℹ️  ENABLE_CONTEXT7_MEMORY not set (will default to false)" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⚠️  No .env file found at apps\server\.env" -ForegroundColor Red
    Write-Host "      Copy apps\server\env.example to apps\server\.env" -ForegroundColor Gray
}
Write-Host ""

Write-Host "✅ Blocker check complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review any warnings above"
Write-Host "2. Run 'npm run build' in apps\web to verify builds work"
Write-Host "3. Follow CONTEXT7_CLEAN_DEPLOYMENT_PLAN.md"
Write-Host ""

