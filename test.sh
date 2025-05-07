#!/bin/bash

# Set text colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Next.js Error Fix and Cache Cleanup Script        ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Fix "metadata" export in dashboard page
DASHBOARD_PAGE="./app/(pages)/dashboard/page.js"
if [ -f "$DASHBOARD_PAGE" ]; then
  echo -e "${YELLOW}Fixing metadata export in dashboard page...${NC}"
  
  # Check if "use client" directive exists
  if grep -q "use client" "$DASHBOARD_PAGE"; then
    # Create a temporary file
    TMP_FILE=$(mktemp)
    
    # Remove "use client" directive OR move metadata to a separate file
    # Option 1: Remove "use client" directive if the component can be a server component
    sed "s/'use client';//g" "$DASHBOARD_PAGE" > "$TMP_FILE"
    
    # Replace the original file
    mv "$TMP_FILE" "$DASHBOARD_PAGE"
    echo -e "${GREEN}✓ Fixed dashboard page metadata issue${NC}"
  else
    echo -e "${YELLOW}No 'use client' directive found in dashboard page. No changes needed.${NC}"
  fi
else
  echo -e "${RED}Dashboard page not found at $DASHBOARD_PAGE${NC}"
fi

# 2. Fix duplicate imports in API files
API_FILES=(
  "./app/api/dashboard/attack-map/page.tsx"
  "./app/api/dashboard/layout.tsx"
  "./app/api/dashboard/predictions/page.tsx"
  "./app/api/dashboard/vulnerabilities/page.tsx"
)

for FILE in "${API_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo -e "${YELLOW}Fixing duplicate imports in $FILE...${NC}"
    
    # Create a temporary file
    TMP_FILE=$(mktemp)
    
    # Remove duplicate React imports
    sed 's/import { useState, useEffect } from '\''react'\'';import { useState, useEffect } from '\''react'\'';/import { useState, useEffect } from '\''react'\'';/g' "$FILE" > "$TMP_FILE"
    
    # Replace the original file
    mv "$TMP_FILE" "$FILE"
    echo -e "${GREEN}✓ Fixed duplicate imports in $FILE${NC}"
  else
    echo -e "${RED}File not found: $FILE${NC}"
  fi
done

# 3. Clean cache and build artifacts
echo -e "\n${YELLOW}Cleaning cache and build artifacts...${NC}"

# Clean Next.js cache
if [ -d ".next" ]; then
  echo -e "Removing .next directory..."
  rm -rf .next
  echo -e "${GREEN}✓ Removed .next directory${NC}"
else
  echo -e "${YELLOW}No .next directory found${NC}"
fi

# Clean node_modules
echo -e "Removing node_modules directory..."
if [ -d "node_modules" ]; then
  rm -rf node_modules
  echo -e "${GREEN}✓ Removed node_modules directory${NC}"
else
  echo -e "${YELLOW}No node_modules directory found${NC}"
fi

# Clean package manager cache
echo -e "Cleaning package manager cache..."

# For npm
if command -v npm &> /dev/null; then
  npm cache clean --force
  echo -e "${GREEN}✓ Cleaned npm cache${NC}"
fi

# For yarn
if command -v yarn &> /dev/null; then
  yarn cache clean
  echo -e "${GREEN}✓ Cleaned yarn cache${NC}"
fi

# For pnpm (your project uses pnpm according to logs)
if command -v pnpm &> /dev/null; then
  pnpm store prune
  echo -e "${GREEN}✓ Cleaned pnpm cache${NC}"
fi

# Clean Vercel CLI cache if installed (since this is a Vercel deployment)
if command -v vercel &> /dev/null; then
  echo -e "Cleaning Vercel cache..."
  rm -rf ~/.vercel/cache
  echo -e "${GREEN}✓ Cleaned Vercel CLI cache${NC}"
fi

# Clean any potential temporary files
echo -e "Cleaning temporary files..."
find . -name "*.tmp" -type f -delete
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# Clean Prisma cache (your project uses Prisma)
if [ -d "node_modules/.prisma" ]; then
  rm -rf node_modules/.prisma
  echo -e "${GREEN}✓ Cleaned Prisma cache${NC}"
fi

# Clean Prisma generated files
if [ -d "node_modules/.pnpm/@prisma" ]; then
  rm -rf node_modules/.pnpm/@prisma
  echo -e "${GREEN}✓ Cleaned Prisma generated files${NC}"
fi

# Make sure Prisma generates fresh files on next build
echo -e "Setting up Prisma for clean regeneration..."
rm -rf node_modules/@prisma/client
rm -rf node_modules/.prisma

echo -e "\n${GREEN}All fixes and cleanup completed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Reinstall dependencies: ${BLUE}pnpm install${NC} (your project uses pnpm)"
echo -e "2. Regenerate Prisma client: ${BLUE}npx prisma generate${NC}"
echo -e "3. Rebuild the project locally: ${BLUE}pnpm run build${NC} to verify fixes"
echo -e "4. Deploy again to Vercel"
echo -e "\n${YELLOW}Note: If you're still experiencing issues, check for other errors in your build logs.${NC}"

# Make the script executable after downloading
chmod +x "$0"