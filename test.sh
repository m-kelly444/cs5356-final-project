#!/bin/bash

# Script to fix Next.js client component issues
echo "Starting Next.js client component fixes..."

# Files that need to be fixed
FILES=(
  "app/(pages)/dashboard/page.js"
  "app/auth/register/page.tsx"
  "app/dashboard/attack-map/page.tsx"
  "app/dashboard/layout.tsx"
  "app/dashboard/predictions/page.tsx"
)

# Process each file
for file in "${FILES[@]}"; do
  echo "Processing $file..."
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "  Warning: File $file does not exist, skipping."
    continue
  fi
  
  # Create a temporary file
  temp_file=$(mktemp)
  
  # Add "use client" directive at the top
  echo '"use client";' > "$temp_file"
  echo "" >> "$temp_file"
  
  # Fix duplicate imports and write to temp file
  cat "$file" | 
    # Remove empty lines at the beginning
    sed '/./,$!d' |
    # Fix duplicate React imports
    sed 's/import { useState, useEffect } from '\''react'\'';import { useState, useEffect } from '\''react'\'';/import { useState, useEffect } from '\''react'\'';/' |
    # Fix other potential duplicate imports
    sed 's/\(import {[^}]*} from \)/\1/' >> "$temp_file"
  
  # Backup original file
  cp "$file" "${file}.bak"
  
  # Replace original file with fixed version
  mv "$temp_file" "$file"
  
  echo "  Fixed $file ✓"
done

echo "All files processed. Original files backed up with .bak extension."
echo "Run your build again to verify the fixes."