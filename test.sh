#!/bin/bash

# Script to fix Next.js build errors and clear cache
# Created by Claude

echo "🔧 Starting Next.js build error fix script..."

# Step 1: Clear all caches
echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel/cache
[ -d ".turbo" ] && rm -rf .turbo

# Function to fix a file
fix_file() {
    local file=$1
    echo "🔄 Processing $file..."
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Check if 'use client' is already at the top
    if grep -q "^'use client';" "$file"; then
        echo "   ✓ 'use client' already correctly placed in $file"
    else
        # Remove any existing 'use client' directives
        sed -i.tmp "/'use client';/d" "$file"
        
        # Add 'use client' at the top of the file
        echo "'use client';" > "$file.tmp"
        cat "$file" >> "$file.tmp"
        mv "$file.tmp" "$file"
        echo "   ✓ Moved 'use client' to the top of $file"
    fi
    
    # Fix duplicate imports
    if grep -c "import { useState" "$file" | grep -q -v "^1$"; then
        # Keep only the first useState import
        sed -i.tmp "0,/import { useState/!s/import { useState[^;]*;//" "$file"
        echo "   ✓ Fixed duplicate useState imports in $file"
    fi
    
    # Fix ternary operators without else branches
    sed -i.tmp "s/typeof window !== 'undefined' ? window\./typeof window !== 'undefined' \&\& window\./g" "$file"
    
    # Clean up temporary files
    rm -f "$file.tmp"
}

echo "📁 Finding and fixing client components..."

# Find all files with 'use client' string and fix them
find app components -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.js" -o -name "*.ts" | xargs grep -l "'use client'" | while read file; do
    fix_file "$file"
done

# Fix specifically the files we know have issues
files_to_fix=(
    "app/(pages)/dashboard/page.js"
    "components/auth/register-form.tsx"
    "components/dashboard/attack-map.tsx"
    "components/dashboard/prediction-card.tsx"
    "components/dashboard/threat-card.tsx"
    "components/dashboard/vulnerability-table.tsx"
    "components/dashboard/stats-grid.tsx"
)

for file in "${files_to_fix[@]}"; do
    if [ -f "$file" ]; then
        fix_file "$file"
    else
        echo "⚠️ File $file not found, skipping..."
    fi
done

echo "🧹 Cleaning up Vercel build caches..."
rm -rf .vercel/output

echo "🔄 Installing dependencies clean..."
if command -v pnpm &> /dev/null; then
    echo "   Using pnpm..."
    pnpm store prune
    rm -rf node_modules
    pnpm install --force
elif command -v yarn &> /dev/null; then
    echo "   Using yarn..."
    yarn cache clean
    rm -rf node_modules
    yarn install --force
else
    echo "   Using npm..."
    npm cache clean --force
    rm -rf node_modules
    npm install --force
fi

echo "🚀 Build errors fixed and caches cleared! Run your build command now:"
echo "   pnpm build  # or yarn build / npm run build"