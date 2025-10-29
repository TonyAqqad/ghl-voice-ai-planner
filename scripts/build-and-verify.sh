#!/bin/bash
# Build and verification script for Render deployment
set -e
echo "ðŸ”¨ Starting frontend build process..."
echo "ðŸ“ Current directory: $(pwd)"
echo "ðŸ“¦ Node version: $(node -v)"
echo "ðŸ“¦ NPM version: $(npm -v)"
if [ ! -d "src" ]; then
  echo "âŒ ERROR: src directory not found!"
  ls -la
  exit 1
fi
if [ ! -f "package.json" ]; then
  echo "âŒ ERROR: package.json not found!"
  exit 1
fi
echo "âœ… Pre-build checks passed"
echo "ðŸ—ï¸  Running Vite build..."
if npm run build 2>&1; then
  echo "âœ… Build command completed"
else
  BUILD_EXIT_CODE=$?
  echo "âŒ Build command failed with exit code: $BUILD_EXIT_CODE"
  exit $BUILD_EXIT_CODE
fi
echo "ðŸ” Verifying build output..."
if [ ! -d "dist" ]; then
  echo "âŒ CRITICAL ERROR: dist directory was NOT created!"
  echo "Directory contents after build:"
  ls -la
  exit 1
fi
if [ ! -f "dist/index.html" ]; then
  echo "âŒ CRITICAL ERROR: dist/index.html NOT found!"
  echo "Dist directory contents:"
  ls -la dist/ || echo "Cannot list dist directory"
  exit 1
fi
echo "âœ… Build verification successful!"
echo "ðŸ“ Dist directory location: $(pwd)/dist"
echo "ðŸ“Š Dist folder size: $(du -sh dist | cut -f1)"
echo "ðŸ“¦ Dist contents:"
ls -lah dist/ | head -15
FILE_COUNT=$(find dist -type f | wc -l)
echo "ðŸ“Š Total files in dist: $FILE_COUNT"
if [ $FILE_COUNT -lt 2 ]; then
  echo "âš ï¸  WARNING: Dist folder has very few files ($FILE_COUNT)"
fi
echo "âœ… Build and verification complete!"
exit 0