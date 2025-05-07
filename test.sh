#!/bin/bash

# Set text colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Next.js build error fixes...${NC}"

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
    
    # Option 2: If client component is required, move metadata to layout.js
    # Uncomment below lines and comment the previous sed command if you prefer this approach
    # echo "Moving metadata to layout file is recommended for client components."
    # echo "Please manually create a layout.js file with the metadata if needed."
    
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

echo -e "${GREEN}All fixes completed! Try deploying your application again.${NC}"
echo -e "${YELLOW}Note: If you're still experiencing issues, you might need to check for other errors in your build logs.${NC}"

# Make the script executable after downloading
chmod +x "$0"