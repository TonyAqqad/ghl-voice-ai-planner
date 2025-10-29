@echo off
echo 🚀 Deploying Supabase Database Integration to GitHub
echo.

cd /d "c:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"

echo 📁 Current directory: %CD%
echo.

echo 📋 Files ready to commit:
echo ✅ server/package.json - Added PostgreSQL driver
echo ✅ server/database.js - Complete PostgreSQL rewrite  
echo ✅ server/schema.sql - New database schema
echo ✅ server/env.example - Updated with DATABASE_URL
echo ✅ SUPABASE_SETUP_COMPLETE.md - Setup documentation
echo ✅ DEPLOY_SUPABASE_TO_RENDER.md - Deployment guide
echo ✅ GITHUB_DEPLOYMENT_GUIDE.md - GitHub deployment guide
echo.

echo 🔧 Running Git commands...
echo.

git add .
if %errorlevel% neq 0 (
    echo ❌ Git add failed. Make sure Git is installed and you're in a Git repository.
    echo 💡 Alternative: Use GitHub Desktop or VS Code instead.
    pause
    exit /b 1
)

git commit -m "Add Supabase PostgreSQL database integration"
if %errorlevel% neq 0 (
    echo ❌ Git commit failed.
    pause
    exit /b 1
)

git push origin main
if %errorlevel% neq 0 (
    echo ❌ Git push failed. Check your GitHub credentials.
    pause
    exit /b 1
)

echo.
echo ✅ Successfully deployed to GitHub!
echo.
echo 🎯 Next Steps:
echo 1. Go to Render Dashboard: https://render.com/dashboard
echo 2. Select your service (ghlvoiceai.captureclient.com)
echo 3. Add Environment Variable:
echo    Key: DATABASE_URL
echo    Value: postgresql://postgres:Sharmoota19!@db.wkmnikcqijqboxwwfxle.supabase.co:5432/postgres
echo 4. Test OAuth: https://ghlvoiceai.captureclient.com/auth/ghl
echo.
echo 🎉 Your Supabase database integration is now live!
pause
