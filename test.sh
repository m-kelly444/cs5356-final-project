#!/bin/bash

# Next.js Cache Cleaner
# This script performs a thorough cleaning of Next.js caches

echo "🧹 Starting Next.js cache cleaning process..."

# 1. Stop any running Next.js server processes
echo "📋 Checking for running Next.js processes..."
if pgrep -f "next"; then
  echo "🛑 Stopping Next.js server processes..."
  pkill -f "next"
  sleep 2
else
  echo "✅ No Next.js processes found running."
fi

# 2. Clear Next.js build cache
echo "🗑️  Removing .next directory..."
if [ -d ".next" ]; then
  rm -rf .next
  echo "✅ .next directory removed successfully."
else
  echo "⚠️  .next directory not found. Skipping."
fi

# 3. Clear npm cache (optional but can help with dependency issues)
echo "🧹 Clearing npm cache..."
npm cache clean --force
echo "✅ npm cache cleared."

# 4. Clear Node modules (optional, but sometimes necessary)
read -p "❓ Do you want to clear node_modules? This will require running npm install again (y/n): " clear_modules
if [ "$clear_modules" = "y" ]; then
  echo "🗑️  Removing node_modules directory..."
  rm -rf node_modules
  echo "✅ node_modules removed successfully."
fi

# 5. Update next.config.js to disable caching temporarily
if [ -f "next.config.js" ]; then
  echo "🔧 Checking next.config.js for cache settings..."
  
  # Check if experimental cache settings already exist
  if grep -q "experimental.*isrMemoryCacheSize" next.config.js; then
    echo "⚠️  Cache settings already exist in next.config.js. Please verify they're set to disable caching."
  else
    echo "🔧 Creating backup of next.config.js..."
    cp next.config.js next.config.js.bak
    
    # Add cache disabling configuration 
    echo "🔧 Updating next.config.js to disable caching..."
    
    # This is a simple approach - for complex configs, manual editing might be needed
    sed -i.tmp '/module.exports/a\\n  experimental: {\n    isrMemoryCacheSize: 0,\n  },' next.config.js
    
    echo "✅ next.config.js updated with cache disabling settings."
  fi
else
  echo "⚠️  next.config.js not found. Creating a basic one with cache disabled..."
  echo "module.exports = {
  reactStrictMode: true,
  experimental: {
    isrMemoryCacheSize: 0,
  },
}" > next.config.js
  echo "✅ Created new next.config.js with cache disabled."
fi

# 6. Check for serverless deployment
if [ -d "/var/task/.next" ]; then
  echo "⚠️  Detected serverless deployment (/var/task/.next exists)."
  echo "⚠️  You will need to redeploy your application for changes to take effect."
  echo "⚠️  This script cannot clean serverless cached files directly."
fi

# 7. Rebuild the application
read -p "❓ Do you want to rebuild the application now? (y/n): " rebuild
if [ "$rebuild" = "y" ]; then
  echo "🔨 Rebuilding Next.js application..."
  
  # If we removed node_modules, reinstall dependencies
  if [ "$clear_modules" = "y" ]; then
    echo "📦 Installing dependencies..."
    npm install
  fi
  
  # Build the application
  npm run build
  
  echo "✅ Application rebuilt successfully."
fi

echo ""
echo "🔍 Additional recommendations:"
echo "  • Clear your browser cache or use incognito mode"
echo "  • Use Ctrl+Shift+R (Cmd+Shift+R on Mac) for hard refresh"
echo "  • If using serverless, redeploy your application"
echo "  • Check your database for invalid date values"
echo ""

echo "✨ Cache cleaning process completed! ✨"