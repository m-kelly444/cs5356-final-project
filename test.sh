#!/bin/bash

# Script to detect and fix Next.js hydration errors
# Usage: ./fix-hydration-errors.sh [directory]

# Default to current directory if no argument is provided
TARGET_DIR=${1:-.}

echo "🔍 Scanning for hydration error sources in $TARGET_DIR..."

# Find all React component files
echo "📁 Searching for React component files..."
COMPONENT_FILES=$(find $TARGET_DIR -type f -name "*.js" -o -name "*.jsx" -o -name "*.tsx" | grep -v "node_modules" | grep -v ".next")

# Create a temporary directory for backups
BACKUP_DIR="hydration-fix-backups-$(date +%s)"
mkdir -p "$BACKUP_DIR"

# Track fixed files
FIXED_FILES=0
FIXED_FILES_LIST=""

# Function to check and fix files
fix_file() {
  local file=$1
  local is_fixed=false
  
  # Create a backup
  cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
  
  # Check if file contains React imports
  if grep -q "import.*React" "$file"; then
    # Add useState and useEffect if not already present
    if ! grep -q "import.*{.*useState" "$file"; then
      # Different approach for different import styles
      if grep -q "import React from" "$file"; then
        # Replace "import React from 'react'" with "import React, { useState, useEffect } from 'react'"
        sed -i.tmp "s/import React from 'react'/import React, { useState, useEffect } from 'react'/" "$file"
        is_fixed=true
      elif grep -q "import \* as React from" "$file"; then
        # Add separate import for hooks
        sed -i.tmp "/import \* as React from 'react'/a\\
import { useState, useEffect } from 'react';" "$file"
        is_fixed=true
      fi
    fi
  else
    # No React import found, add one
    sed -i.tmp "1i\\
import { useState, useEffect } from 'react';" "$file"
    is_fixed=true
  fi
  
  # Fix window access
  if grep -q "window\." "$file"; then
    # Add "use client" directive if not present
    if ! grep -q '"use client"' "$file"; then
      sed -i.tmp "1i\\
\"use client\";" "$file"
    fi
    
    # Replace direct window access with safe checks
    sed -i.tmp "s/window\./typeof window !== 'undefined' ? window\./g" "$file"
    sed -i.tmp "s/\.innerHTML/.innerHTML : null/g" "$file"
    is_fixed=true
  fi
  
  # Fix document access
  if grep -q "document\." "$file"; then
    # Add "use client" directive if not present
    if ! grep -q '"use client"' "$file"; then
      sed -i.tmp "1i\\
\"use client\";" "$file"
    fi
    
    # Replace direct document access with safe checks
    sed -i.tmp "s/document\./typeof document !== 'undefined' ? document\./g" "$file"
    sed -i.tmp "s/\.getElementById/.getElementById : null/g" "$file"
    is_fixed=true
  fi
  
  # Fix localStorage usage
  if grep -q "localStorage" "$file"; then
    # Add "use client" directive if not present
    if ! grep -q '"use client"' "$file"; then
      sed -i.tmp "1i\\
\"use client\";" "$file"
    fi
    
    # Replace direct localStorage access with safe checks
    sed -i.tmp "s/localStorage\./typeof window !== 'undefined' ? localStorage\./g" "$file"
    sed -i.tmp "s/\.getItem/.getItem : null/g" "$file"
    is_fixed=true
  fi
  
  # Fix sessionStorage usage
  if grep -q "sessionStorage" "$file"; then
    # Add "use client" directive if not present
    if ! grep -q '"use client"' "$file"; then
      sed -i.tmp "1i\\
\"use client\";" "$file"
    fi
    
    # Replace direct sessionStorage access with safe checks
    sed -i.tmp "s/sessionStorage\./typeof window !== 'undefined' ? sessionStorage\./g" "$file"
    sed -i.tmp "s/\.getItem/.getItem : null/g" "$file"
    is_fixed=true
  fi
  
  # Fix useLayoutEffect
  if grep -q "useLayoutEffect" "$file"; then
    sed -i.tmp "s/useLayoutEffect/useEffect/g" "$file"
    is_fixed=true
  fi
  
  # Fix date rendering
  if grep -q "new Date()" "$file" || grep -q "toLocaleString" "$file"; then
    # Try to find JSX elements with dates
    perl -pi.tmp -e 's/(<[a-zA-Z][a-zA-Z0-9]*[^>]*>)([^<]*)new Date\(\)([^<]*)(<\/[a-zA-Z][a-zA-Z0-9]*>)/$1$2new Date\(\)$3$4\n{/* Add suppressHydrationWarning to parent element */}/g' "$file"
    echo "// TODO: Manually add suppressHydrationWarning to elements with dates" >> "$file"
    is_fixed=true
  fi
  
  # If file was fixed, increment counter
  if [ "$is_fixed" = true ]; then
    FIXED_FILES=$((FIXED_FILES + 1))
    FIXED_FILES_LIST="$FIXED_FILES_LIST\n- $file"
  fi
  
  # Clean up temp files
  rm -f "$file.tmp"
}

# Process each file
for file in $COMPONENT_FILES; do
  fix_file "$file"
done

# Create helper script
cat > "wrap-component-ssr-disabled.js" << 'EOF'
// Usage: node wrap-component-ssr-disabled.js ComponentName
// This creates a wrapper that disables SSR for the component

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.log("Usage: node wrap-component-ssr-disabled.js ComponentName");
  process.exit(1);
}

const componentName = process.argv[2];
const wrapperFileName = `${componentName}Wrapper.jsx`;

const wrapperContent = `"use client";

import dynamic from 'next/dynamic';

// Disable SSR for this component
const ${componentName}NoSSR = dynamic(
  () => import('./${componentName}'),
  { ssr: false }
);

export default function ${componentName}Wrapper(props) {
  return <${componentName}NoSSR {...props} />;
}
`;

fs.writeFileSync(wrapperFileName, wrapperContent);
console.log(`Created ${wrapperFileName} - use this component instead of ${componentName} to avoid hydration errors`);
EOF

# Create HTML wrapper fix script
cat > "fix-layout-hydration.js" << 'EOF'
// Usage: node fix-layout-hydration.js [file.js]
// This adds suppressHydrationWarning to root elements

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.log("Usage: node fix-layout-hydration.js [layout-file.js]");
  process.exit(1);
}

const fileName = process.argv[2];
const fileContent = fs.readFileSync(fileName, 'utf8');

// Add suppressHydrationWarning to html and body tags
let updatedContent = fileContent
  .replace(/<html([^>]*)>/g, '<html$1 suppressHydrationWarning>')
  .replace(/<body([^>]*)>/g, '<body$1 suppressHydrationWarning>');

// Write the updated content back to the file
fs.writeFileSync(fileName, updatedContent);
console.log(`Updated ${fileName} with suppressHydrationWarning`);

// Create a Script component to handle browser extensions
const scriptComponentPath = path.join(path.dirname(fileName), 'HydrationScript.jsx');
const scriptComponentContent = `"use client";

// This component helps prevent hydration errors from browser extensions
export default function HydrationScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: \`
          (function() {
            // Remove attributes added by browser extensions
            var observer = new MutationObserver(function(mutations) {
              mutations.forEach(function(mutation) {
                if (mutation.attributeName) {
                  var attributeName = mutation.attributeName;
                  if (attributeName.startsWith('data-') || 
                      attributeName.startsWith('cz-') ||
                      attributeName.startsWith('aria-') && !attributeName.startsWith('aria-')) {
                    mutation.target.removeAttribute(attributeName);
                  }
                }
              });
            });
            
            // Start observing the document
            observer.observe(document.documentElement, { 
              attributes: true,
              childList: false,
              subtree: true,
              attributeFilter: ['data-*', 'cz-*', 'aria-*'] 
            });
          })();
        \`,
      }}
    />
  );
}
`;

fs.writeFileSync(scriptComponentPath, scriptComponentContent);
console.log(`Created ${scriptComponentPath} - import and add this component to your layout`);
EOF

# Generate report
echo "🔧 Fixed $FIXED_FILES files with potential hydration issues:"
if [ $FIXED_FILES -gt 0 ]; then
  echo -e "$FIXED_FILES_LIST"
else
  echo "No files were automatically fixed."
fi

echo ""
echo "💡 Next steps:"
echo "1. Backups of modified files have been saved to $BACKUP_DIR"
echo "2. For component-specific issues, use the generated script:"
echo "   node wrap-component-ssr-disabled.js ProblemComponent"
echo "3. For layout-level fixes, use:"
echo "   node fix-layout-hydration.js pages/_app.jsx"
echo ""
echo "Common solutions for remaining issues:"
echo "- Add suppressHydrationWarning to elements with dynamic content"
echo "- Move browser API calls to useEffect hooks"
echo "- Convert problematic components to Client Components with 'use client'"