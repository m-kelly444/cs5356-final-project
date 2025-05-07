#!/bin/bash

# Script to find and fix toISOString() calls across the repo
# This will make the calls safer by adding proper date validation

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting toISOString() safety check across repository...${NC}"

# Function to create a backup
create_backup() {
    local file="$1"
    local backup_dir=".toISOString_backups"
    mkdir -p "$backup_dir"
    cp "$file" "$backup_dir/$(basename "$file").backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}Created backup for: $file${NC}"
}

# Function to safely replace toISOString calls
fix_file() {
    local file="$1"
    local temp_file="${file}.tmp"
    
    # Create backup first
    create_backup "$file"
    
    # Pattern 1: Simple .toISOString() calls
    sed -E 's/([a-zA-Z_$][a-zA-Z0-9_$]*\.)+toISOString\(\)/((val) => val instanceof Date \&\& !isNaN(val.getTime()) ? val.toISOString() : null)(\0)/g' "$file" > "$temp_file"
    
    # Pattern 2: Method chaining with toISOString
    sed -i.bak -E 's/(\.)toISOString\(\)(/\1toISOString\?\(\)/g' "$temp_file"
    
    # Check if changes were made
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo -e "${GREEN}Fixed: $file${NC}"
        return 0
    else
        rm "$temp_file"
        return 1
    fi
}

# Function to add a safe toISOString helper at the top of JS/TS files
add_helper_function() {
    local file="$1"
    local helper="
// Safe toISOString helper
const safeToISOString = (date) => {
    if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString();
    }
    console.warn('Invalid date passed to toISOString:', date);
    return null;
};
"

    # Check if helper already exists
    if ! grep -q "safeToISOString" "$file"; then
        echo "$helper" | cat - "$file" > temp && mv temp "$file"
        echo -e "${GREEN}Added helper function to: $file${NC}"
    fi
}

# Search for files with toISOString calls
echo -e "${YELLOW}Searching for files with toISOString() calls...${NC}"

# Find all JS/TS files and search for toISOString
files_with_toisostring=$(find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.next/*" | xargs grep -l "toISOString" 2>/dev/null)

if [ -z "$files_with_toisostring" ]; then
    echo -e "${RED}No files found with toISOString() calls.${NC}"
    exit 0
fi

echo -e "${YELLOW}Found files with toISOString() calls:${NC}"
echo "$files_with_toisostring" | while read file; do
    echo "  - $file"
done

echo -e "\n${YELLOW}Processing files...${NC}"
fixed_count=0

# Process each file
echo "$files_with_toisostring" | while read file; do
    # Show current toISOString usage
    echo -e "${YELLOW}Checking: $file${NC}"
    grep -n "toISOString" "$file"
    
    # Ask for user confirmation (comment out for automatic fixing)
    read -p "Fix this file? (y/n/a for all): " choice
    
    case $choice in
        [Yy]* )
            fix_file "$file"
            ((fixed_count++))
            ;;
        [Aa]* )
            # Auto-fix all remaining files
            echo -e "${GREEN}Auto-fixing all remaining files...${NC}"
            echo "$files_with_toisostring" | while read remaining_file; do
                if [ "$remaining_file" != "$file" ]; then
                    fix_file "$remaining_file"
                fi
            done
            break
            ;;
        * )
            echo -e "${RED}Skipped: $file${NC}"
            ;;
    esac
done

# Summary
echo -e "\n${GREEN}Summary:${NC}"
echo -e "- Files processed: $(echo "$files_with_toisostring" | wc -l)"
echo -e "- Files fixed: $fixed_count"
echo -e "- Backups created in: .toISOString_backups/"

# Additional recommendations
echo -e "\n${YELLOW}Additional Recommendations:${NC}"
echo "1. Add a type guard utility function:"
echo "   const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());"
echo ""
echo "2. Consider using a library like date-fns or moment.js for safer date handling"
echo ""
echo "3. Add ESLint rule to catch future unchecked toISOString() calls"
echo ""
echo "4. Review your database/API data to ensure dates are properly formatted"

# Create an .eslintrc rule suggestion
echo -e "\n${YELLOW}Suggested ESLint rule to add to .eslintrc:${NC}"
cat << 'EOF'
{
  "rules": {
    "no-unsafe-toisostring": {
      "create": function(context) {
        return {
          "CallExpression": function(node) {
            if (node.callee.type === "MemberExpression" && 
                node.callee.property.name === "toISOString") {
              // Check if it's wrapped in a safe check
              const parent = node.parent;
              if (!parent || 
                  !(parent.type === "ConditionalExpression" || 
                    parent.type === "IfStatement" ||
                    parent.type === "CallExpression" && parent.callee.name === "safeToISOString")) {
                context.report({
                  node: node,
                  message: "toISOString() should be wrapped in a date validation check"
                });
              }
            }
          }
        };
      }
    }
  }
}
EOF

echo -e "\n${GREEN}Script completed!${NC}"