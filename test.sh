#!/bin/bash

echo "🔍 Searching for .toISOString() usages..."
FILES=$(grep -rl --include=\*.{ts,tsx} '\.toISOString()' .)

if [ -z "$FILES" ]; then
  echo "✅ No .toISOString() found."
  exit 0
fi

echo "📦 Backing up and patching the following files:"
for file in $FILES; do
  echo "  - $file"
  cp "$file" "${file}.bak" # Backup

  # Replace any expression like "x.toISOString()" with a safe-checked version
  sed -E -i '' 's/([a-zA-Z0-9_]+)\.toISOString\(\)/(\1 instanceof Date \&\& !isNaN(\1.getTime()) \? \1.toISOString() : null)/g' "$file"
done

echo ""
echo "✅ Done. Originals backed up with .bak extensions."
