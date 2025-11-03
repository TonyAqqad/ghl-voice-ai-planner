@echo off
echo 🧹 Cleaning up outdated files...
echo.

cd /d "c:\Users\eaqqa\OneDrive\Desktop\THE MONEY MAKER\cursor-agent-builder\sandbox-apps\ghl-voice-ai-planner"

echo 📄 Deleting large outdated files...
if exist ".repomix-output.txt" del ".repomix-output.txt"
if exist "ghl-voice-ai-planner-src.zip" del "ghl-voice-ai-planner-src.zip"
if exist "GHL-WORKFLOW-PROCESS.MD" del "GHL-WORKFLOW-PROCESS.MD"

echo 📄 Deleting completed status files...
if exist "IMPLEMENTATION_STATUS.md" del "IMPLEMENTATION_STATUS.md"
if exist "FUNCTIONAL_IMPROVEMENTS_COMPLETE.md" del "FUNCTIONAL_IMPROVEMENTS_COMPLETE.md"
if exist "UX_IMPROVEMENTS_COMPLETE.md" del "UX_IMPROVEMENTS_COMPLETE.md"
if exist "EXPERT_TEMPLATES_COMPLETE.md" del "EXPERT_TEMPLATES_COMPLETE.md"
if exist "OPTIMIZATION_COMPLETE.md" del "OPTIMIZATION_COMPLETE.md"
if exist "PLATFORM_COMPLETE.md" del "PLATFORM_COMPLETE.md"
if exist "ULTRA_MODE_SUMMARY.md" del "ULTRA_MODE_SUMMARY.md"
if exist "ULTRA_DEVELOPMENT_COMPLETE.md" del "ULTRA_DEVELOPMENT_COMPLETE.md"
if exist "ULTRA_APP_COMPLETE.md" del "ULTRA_APP_COMPLETE.md"
if exist "ULTRA_BUILD_COMPLETE.md" del "ULTRA_BUILD_COMPLETE.md"
if exist "ALL_MODULES_COMPLETE.md" del "ALL_MODULES_COMPLETE.md"
if exist "IMPLEMENTATION_COMPLETE.md" del "IMPLEMENTATION_COMPLETE.md"
if exist "MODULES_COMPLETE.md" del "MODULES_COMPLETE.md"
if exist "BUILD_STATUS.md" del "BUILD_STATUS.md"
if exist "FINAL_BUILD_STATUS.md" del "FINAL_BUILD_STATUS.md"
if exist "MAJOR_PROGRESS.md" del "MAJOR_PROGRESS.md"
if exist "LOCAL_APP_STATUS.md" del "LOCAL_APP_STATUS.md"
if exist "ELEVENLABS_CONNECTED.md" del "ELEVENLABS_CONNECTED.md"
if exist "ELEVENLABS_SETUP.md" del "ELEVENLABS_SETUP.md"
if exist "OAUTH_COMPLETE.md" del "OAUTH_COMPLETE.md"
if exist "SUCCESS.md" del "SUCCESS.md"

echo 📄 Deleting fix/update files...
if exist "RENDER_BUILD_FIX.md" del "RENDER_BUILD_FIX.md"
if exist "QUICK_FIX.md" del "QUICK_FIX.md"
if exist "TRIGGER_DEPLOYMENT.md" del "TRIGGER_DEPLOYMENT.md"
if exist "WAITING_FOR_RENDER.md" del "WAITING_FOR_RENDER.md"
if exist "DEPLOYMENT_IN_PROGRESS.md" del "DEPLOYMENT_IN_PROGRESS.md"
if exist "CURRENT_STATUS.md" del "CURRENT_STATUS.md"
if exist "COMPLETE_FIX.md" del "COMPLETE_FIX.md"
if exist "SSL_FIX.md" del "SSL_FIX.md"
if exist "PUSHED_TO_GITHUB.md" del "PUSHED_TO_GITHUB.md"
if exist "UPDATE_RENDER_SETTINGS.md" del "UPDATE_RENDER_SETTINGS.md"
if exist "MANUAL_RENDER_FIX.md" del "MANUAL_RENDER_FIX.md"
if exist "RENDER_DEPLOY_FIX.md" del "RENDER_DEPLOY_FIX.md"
if exist "FIX_FOR_RENDER.md" del "FIX_FOR_RENDER.md"
if exist "DEPLOY_FROM_CODESPACES.md" del "DEPLOY_FROM_CODESPACES.md"
if exist "PUSH_TO_GITHUB.md" del "PUSH_TO_GITHUB.md"
if exist "ENV_FIX.md" del "ENV_FIX.md"
if exist "BROWSER_CONSOLE_TEST.md" del "BROWSER_CONSOLE_TEST.md"
if exist "TESTED_OAUTH_INTEGRATION.md" del "TESTED_OAUTH_INTEGRATION.md"
if exist "OAUTH_URL_UPDATE.md" del "OAUTH_URL_UPDATE.md"

echo 📄 Deleting outdated deployment guides...
if exist "DEPLOYMENT_GUIDE.md" del "DEPLOYMENT_GUIDE.md"
if exist "PRODUCTION_DEPLOYMENT_GUIDE.md" del "PRODUCTION_DEPLOYMENT_GUIDE.md"
if exist "PRODUCTION_DEPLOYMENT.md" del "PRODUCTION_DEPLOYMENT.md"
if exist "ULTRA-ENHANCED-README.md" del "ULTRA-ENHANCED-README.md"
if exist "deploy-to-render.md" del "deploy-to-render.md"
if exist "RAILWAY_QUICK_DEPLOY.md" del "RAILWAY_QUICK_DEPLOY.md"
if exist "DOMAIN_SETUP_SUMMARY.md" del "DOMAIN_SETUP_SUMMARY.md"
if exist "OAUTH_SETUP_GUIDE.md" del "OAUTH_SETUP_GUIDE.md"
if exist "HOW_TO_TEST.md" del "HOW_TO_TEST.md"
if exist "PRODUCTION_READINESS.md" del "PRODUCTION_READINESS.md"
if exist "WEBHOOK_SERVER_SETUP.md" del "WEBHOOK_SERVER_SETUP.md"
if exist "GHL_REDIRECT_URL_SETUP.md" del "GHL_REDIRECT_URL_SETUP.md"
if exist "MANUAL_GIT_PUSH.md" del "MANUAL_GIT_PUSH.md"

echo 📄 Deleting old HTML demo files...
if exist "voice-ai-deployer.html" del "voice-ai-deployer.html"
if exist "schema-registry.html" del "schema-registry.html"
if exist "readiness-panel.html" del "readiness-panel.html"
if exist "vapi-demo.html" del "vapi-demo.html"
if exist "compliance-safety.html" del "compliance-safety.html"
if exist "rate-limit-queue.html" del "rate-limit-queue.html"
if exist "export-center.html" del "export-center.html"
if exist "qa-golden-pack.html" del "qa-golden-pack.html"
if exist "workflow-integration.html" del "workflow-integration.html"
if exist "demo.html" del "demo.html"

echo 📄 Deleting utility files...
if exist "generate-components.js" del "generate-components.js"
if exist "update-colors.js" del "update-colors.js"
if exist "webhook-server.cjs" del "webhook-server.cjs"
if exist "webhook-package.json" del "webhook-package.json"
if exist "oauth-test.html" del "oauth-test.html"
if exist "CURSOR_TASKS.md" del "CURSOR_TASKS.md"

echo 📄 Deleting old setup files...
if exist "setup-environment.ps1" del "setup-environment.ps1"
if exist "setup-environment.sh" del "setup-environment.sh"
if exist "start-dev.ps1" del "start-dev.ps1"
if exist "start-dev.sh" del "start-dev.sh"

echo.
echo ✅ Cleanup complete!
echo 📊 Estimated space saved: ~1.2MB+
echo.
echo 🎯 Files kept (current/important):
echo ✅ src/ - Main React application
echo ✅ server/ - Backend with Supabase
echo ✅ Current documentation (SUPABASE_SETUP_COMPLETE.md, etc.)
echo ✅ Configuration files (package.json, vite.config.ts, etc.)
echo.
pause
