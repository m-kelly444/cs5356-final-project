#!/bin/bash

echo "🔍 Scanning for .toISOString() calls..."

FILES=$(grep -rl --include=\*.{ts,tsx} '\.toISOString()' .)

if [ -z "$FILES" ]; then
  echo "✅ No toISOString() calls found. You're good!"
  exit 0
fi

echo "📦 Patching files and backing up originals..."

for file in $FILES; do
  echo "  - $file"
  cp "$file" "$file.bak"

  # Replace any instance of "var.toISOString()" with "safeToISOString(var)"
  sed -E -i '' 's/([a-zA-Z0-9_]+)\.toISOString\(\)/safeToISOString(\1)/g' "$file"

  # Ensure the helper import is present
  grep -q "safeToISOString" "$file" || \
  sed -i '' '1s;^;import { safeToISOString } from "@/lib/utils/date";\n;' "$file"
done

echo "✅ Replacements complete. Backups saved with .bak extension."
