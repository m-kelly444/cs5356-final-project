#!/bin/bash

# Search in the specific compiled file mentioned in the error
if [ -f ".next/server/chunks/510.js" ]; then
    echo "Searching in .next/server/chunks/510.js..."
    grep -n -C 3 'sql.*(' .next/server/chunks/510.js
fi

# Search for the specific error pattern in all compiled files
echo -e "\nSearching for templateFn errors..."
grep -rn --include="*.js" "templateFn" .next/ 2>/dev/null

# Search for sql() patterns in all compiled JS
echo -e "\nSearching for sql() in .next directory..."
grep -rn --include="*.js" 'sql\s*(' .next/ 2>/dev/null | head -20