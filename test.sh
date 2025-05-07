#!/bin/bash

# Vercel Date Fix - Complete Installation Script
# This script fixes the "toISOString is not a function" error in Vercel deployments
# by creating and modifying all necessary files in one operation.

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}Vercel Date Fix - All-in-One Script${NC}"
echo -e "${BLUE}=======================================${NC}"
echo
echo -e "This script will fix the 'toISOString is not a function' error"
echo -e "that occurs in Vercel deployments but not locally."
echo

# Create directory structure
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p ./utils
mkdir -p ./middleware
mkdir -p ./lib
mkdir -p ./scripts
mkdir -p ./patches

# Create environment normalizer
echo -e "${GREEN}Creating environment normalizer...${NC}"
cat > ./utils/environmentNormalizer.js << 'EOF'
/**
 * Environment Normalizer
 * This ensures consistent behavior between local and Vercel environments
 */

// Add this file to your Next.js app to ensure consistent Date handling

// Create a flag to detect if we're running in Vercel
const isVercel = process.env.VERCEL === '1';

// Store original Date methods
const originalDateConstructor = Date;
const originalToISOString = Date.prototype.toISOString;
const originalToJSON = Date.prototype.toJSON;

// Force consistent timezone behavior
process.env.TZ = 'UTC';

// Normalize Date constructor to ensure consistent behavior
global.Date = function(...args) {
  try {
    // Handle problematic input formats that might differ between environments
    if (args.length === 1) {
      const input = args[0];
      
      // Handle null/undefined
      if (input == null) {
        return new originalDateConstructor();
      }
      
      // If it's already a Date object, clone it
      if (input instanceof originalDateConstructor) {
        return new originalDateConstructor(input.getTime());
      }
      
      // Special handling for string formats that cause issues
      if (typeof input === 'string') {
        // Handle ISO format consistently
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(input)) {
          // Force UTC interpretation for ISO strings
          return new originalDateConstructor(input + (input.endsWith('Z') ? '' : 'Z'));
        }
        
        // Handle date-only strings
        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
          return new originalDateConstructor(input + 'T00:00:00.000Z');
        }
      }
    }
    
    // Default to original behavior for other cases
    return new originalDateConstructor(...args);
  } catch (e) {
    console.warn('Date constructor error:', e);
    return new originalDateConstructor();
  }
};

// Copy all static properties and prototype
Object.setPrototypeOf(global.Date, originalDateConstructor);
global.Date.prototype = originalDateConstructor.prototype;
global.Date.prototype.constructor = global.Date;

// Override toISOString to be more resilient
Date.prototype.toISOString = function() {
  try {
    return originalToISOString.call(this);
  } catch (e) {
    console.warn('toISOString error, using fallback');
    
    // Fallback implementation
    const pad = (num) => String(num).padStart(2, '0');
    
    const year = this.getUTCFullYear();
    const month = pad(this.getUTCMonth() + 1);
    const day = pad(this.getUTCDate());
    const hours = pad(this.getUTCHours());
    const minutes = pad(this.getUTCMinutes());
    const seconds = pad(this.getUTCSeconds());
    const ms = String(this.getUTCMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
  }
};

// Override toJSON to be more resilient
Date.prototype.toJSON = function() {
  try {
    return originalToJSON.call(this);
  } catch (e) {
    console.warn('toJSON error, using toISOString fallback');
    return this.toISOString();
  }
};

// Add validation for objects with date fields
global.validateDates = function(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => global.validateDates(item));
  }
  
  // Create a shallow copy to avoid modifying the original
  const result = {...obj};
  
  // Process all keys
  Object.keys(result).forEach(key => {
    const value = result[key];
    
    // Check if this looks like a date field
    if (/date|Date|At$|_at$/i.test(key)) {
      if (value && !(value instanceof Date)) {
        try {
          result[key] = new Date(value);
        } catch (e) {
          console.warn(`Failed to convert ${key} to Date`);
        }
      }
    } else if (value && typeof value === 'object') {
      // Recursively process nested objects
      result[key] = global.validateDates(value);
    }
  });
  
  return result;
};

console.log(`Environment normalizer loaded (Vercel: ${isVercel})`);
EOF

# Create middleware
echo -e "${GREEN}Creating middleware...${NC}"
cat > ./middleware/dateNormalizer.js << 'EOF'
import '../utils/environmentNormalizer';

/**
 * Middleware to normalize date handling between environments
 */
export function withDateNormalization(handler) {
  return async (req, res) => {
    try {
      // Validate request body if it exists
      if (req.body && typeof req.body === 'object') {
        req.body = global.validateDates(req.body);
      }
      
      // Validate query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = global.validateDates(req.query);
      }
      
      return await handler(req, res);
    } catch (error) {
      if (error.message && error.message.includes('toISOString is not a function')) {
        console.error('Date conversion error caught by middleware:', error);
        res.status(500).json({
          error: 'Date conversion error',
          message: 'The server encountered an issue processing date values'
        });
      } else {
        throw error;
      }
    }
  };
}

export default withDateNormalization;
EOF

# Create database patch
echo -e "${GREEN}Creating database patch...${NC}"
cat > ./lib/databasePatch.js << 'EOF'
import '../utils/environmentNormalizer';

/**
 * Database patch for consistent date handling
 * Import this in your database connection file
 */

// Original function reference storage
const originalFunctions = new Map();

// Function to patch methods that might handle dates
export function patchMethod(object, methodName) {
  if (!object || typeof object !== 'object' || typeof object[methodName] !== 'function') {
    return;
  }
  
  // Store original method if not already stored
  if (!originalFunctions.has(`${object.constructor.name}.${methodName}`)) {
    originalFunctions.set(`${object.constructor.name}.${methodName}`, object[methodName]);
  }
  
  // Replace with our patched version
  const originalMethod = originalFunctions.get(`${object.constructor.name}.${methodName}`);
  
  object[methodName] = function(...args) {
    try {
      // Process arguments to ensure dates are valid
      const processedArgs = args.map(arg => {
        if (arg && typeof arg === 'object') {
          return global.validateDates(arg);
        }
        return arg;
      });
      
      // Call original method with processed arguments
      return originalMethod.apply(this, processedArgs);
    } catch (error) {
      if (error.message && error.message.includes('toISOString is not a function')) {
        console.error(`Date error in ${methodName}:`, error);
        console.error('Arguments:', JSON.stringify(args, (k, v) => 
          v instanceof Date ? v.toString() : v
        ));
        throw new Error(`Date conversion error in ${methodName}: ${error.message}`);
      }
      throw error;
    }
  };
}

// Patch database client methods
export function patchDatabaseClient(client) {
  if (!client) return client;
  
  // Common method names that often handle dates
  const methodsToPatch = [
    'query', 'execute', 'find', 'findOne', 'findMany',
    'create', 'update', 'delete', 'upsert', 'connect'
  ];
  
  // Patch all methods found on the client
  methodsToPatch.forEach(methodName => {
    if (client[methodName] && typeof client[methodName] === 'function') {
      patchMethod(client, methodName);
    }
  });
  
  return client;
}

console.log('Database patch loaded for consistent date handling');
EOF

# Create diagnostic script
echo -e "${GREEN}Creating diagnostic script...${NC}"
cat > ./scripts/vercel-diagnostic.js << 'EOF'
// This script helps diagnose date-related issues in Vercel
require('../utils/environmentNormalizer');

// Check environment
console.log('Environment diagnostics:');
console.log('- Node version:', process.version);
console.log('- Timezone:', process.env.TZ);
console.log('- Platform:', process.platform);
console.log('- Is Vercel:', process.env.VERCEL === '1');

// Test date handling
console.log('\nTesting date handling:');

// Test 1: Basic date creation
try {
  const date1 = new Date();
  console.log('Basic date:', date1.toISOString());
} catch (e) {
  console.error('Basic date error:', e.message);
}

// Test 2: ISO string parsing
try {
  const date2 = new Date('2025-05-06T12:00:00.000Z');
  console.log('ISO string date:', date2.toISOString());
} catch (e) {
  console.error('ISO string error:', e.message);
}

// Test 3: Testing problematic formats
const problematicFormats = [
  '2025-05-06',              // Date only
  '2025-05-06 12:00:00',     // Non-standard format
  '05/06/2025',              // US format
  '06-May-2025',             // Text month
  1715087700000,             // Timestamp
  { date: '2025-05-06' },    // Object with date field
  null,                      // Null
  undefined                  // Undefined
];

problematicFormats.forEach((format, index) => {
  try {
    const date = format instanceof Object ? 
      global.validateDates(format).date : 
      new Date(format);
    
    console.log(`Format ${index + 1}:`, format);
    console.log(`Result ${index + 1}:`, date instanceof Date ? date.toISOString() : date);
  } catch (e) {
    console.error(`Format ${index + 1} error:`, e.message);
  }
});

console.log('\nDiagnostics complete!');
EOF

# Create Vercel config
echo -e "${GREEN}Creating Vercel configuration...${NC}"
cat > ./vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "builds": [
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ],
  "build": {
    "env": {
      "TZ": "UTC"
    }
  },
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  }
}
EOF

# Create patch for built JS file
echo -e "${GREEN}Creating direct patch for build output...${NC}"
cat > ./patches/fix-toISOString.js << 'EOF'
/**
 * This script directly patches the built JavaScript files to fix the toISOString error
 */

const fs = require('fs');
const path = require('path');

// Function to apply patch to a file
function patchFile(filePath) {
  console.log(`Patching file: ${filePath}`);
  
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Create backup
    fs.writeFileSync(`${filePath}.bak`, content, 'utf8');
    console.log(`Created backup: ${filePath}.bak`);
    
    // Apply fixes
    let patchedContent = content;
    
    // Fix toISOString calls to handle non-Date objects
    patchedContent = patchedContent.replace(
      /(\w+)\.toISOString\(\)/g, 
      "($1 instanceof Date ? $1.toISOString() : new Date($1).toISOString())"
    );
    
    // Fix mapToDriverValue function if it exists
    if (patchedContent.includes('mapToDriverValue')) {
      patchedContent = patchedContent.replace(
        /(function\s+mapToDriverValue\s*\([^)]*\)\s*\{)/,
        '$1\n  if (arguments[0] && typeof arguments[0].toISOString !== "function" && arguments[0] !== null && arguments[0] !== undefined) { arguments[0] = new Date(arguments[0]); }'
      );
    }
    
    // Write patched content back to file
    fs.writeFileSync(filePath, patchedContent, 'utf8');
    console.log(`Successfully patched ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error patching ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and patch files
function findAndPatchFiles(directory) {
  console.log(`Scanning directory: ${directory}`);
  
  try {
    const files = fs.readdirSync(directory);
    let patchedCount = 0;
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Skip node_modules and hidden directories
        if (file !== 'node_modules' && !file.startsWith('.')) {
          patchedCount += findAndPatchFiles(fullPath);
        }
      } else if (stats.isFile() && file.endsWith('.js')) {
        // Check if file contains toISOString
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('toISOString')) {
          if (patchFile(fullPath)) {
            patchedCount++;
          }
        }
      }
    }
    
    return patchedCount;
  } catch (error) {
    console.error(`Error scanning ${directory}:`, error.message);
    return 0;
  }
}

// Create directory for direct patching if it doesn't exist
if (!fs.existsSync('./.next')) {
  console.log('No .next directory found. Skipping direct patching.');
} else {
  console.log('Starting direct patching of built files...');
  const patchedCount = findAndPatchFiles('./.next');
  console.log(`Finished patching ${patchedCount} files.`);
}

// Specific file mentioned in the error
const specificErrorFile = './.next/server/chunks/862.js';
if (fs.existsSync(specificErrorFile)) {
  console.log(`Patching specific file mentioned in error: ${specificErrorFile}`);
  patchFile(specificErrorFile);
}

console.log('Direct patching complete.');
EOF

# Create a setup script for entry points
echo -e "${GREEN}Creating setup script for application entry points...${NC}"
cat > ./patches/setup-app.js << 'EOF'
/**
 * This script sets up the application entry points
 */

const fs = require('fs');
const path = require('path');

// Possible entry points
const possibleEntryPoints = [
  './pages/_app.js',
  './pages/_app.tsx',
  './app/layout.js',
  './app/layout.tsx'
];

// Import statement to add
const importStatement = "import '../utils/environmentNormalizer';\n";

// Find and update entry points
let entryPointFound = false;

for (const entryPoint of possibleEntryPoints) {
  if (fs.existsSync(entryPoint)) {
    console.log(`Found entry point: ${entryPoint}`);
    
    // Read the file
    const content = fs.readFileSync(entryPoint, 'utf8');
    
    // Check if already imported
    if (content.includes('environmentNormalizer')) {
      console.log(`Entry point ${entryPoint} already imports environmentNormalizer`);
      entryPointFound = true;
      continue;
    }
    
    // Create backup
    fs.writeFileSync(`${entryPoint}.bak`, content, 'utf8');
    
    // Add import statement at the top
    const updatedContent = importStatement + content;
    fs.writeFileSync(entryPoint, updatedContent, 'utf8');
    
    console.log(`Updated entry point: ${entryPoint}`);
    entryPointFound = true;
  }
}

if (!entryPointFound) {
  console.log('No entry points found. You\'ll need to manually import the environmentNormalizer.');
  console.log('Add this line to your app entry point:');
  console.log(importStatement);
}

// Find and update API routes
const apiDirectory = './pages/api';

function updateApiRoutes(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`API directory ${directory} not found`);
    return 0;
  }
  
  console.log(`Scanning API directory: ${directory}`);
  let updatedCount = 0;
  
  try {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively scan subdirectories
        updatedCount += updateApiRoutes(fullPath);
      } else if ((file.endsWith('.js') || file.endsWith('.ts')) && !file.endsWith('.d.ts')) {
        // Update API route
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if already using our middleware
        if (content.includes('withDateNormalization')) {
          console.log(`API route ${fullPath} already uses withDateNormalization`);
          continue;
        }
        
        // Create backup
        fs.writeFileSync(`${fullPath}.bak`, content, 'utf8');
        
        // Add middleware
        let updatedContent = content;
        
        // Add import statement
        const importPath = path.relative(path.dirname(fullPath), './middleware/dateNormalizer')
          .replace(/\\/g, '/'); // Replace backslashes with forward slashes for Windows
        
        const middlewareImport = `import { withDateNormalization } from '${importPath}';\n\n`;
        
        // Find export default statement
        const exportDefaultRegex = /export\s+default(?:\s+async)?\s+(?:function\s+)?(\w+)/;
        const exportDefaultMatch = content.match(exportDefaultRegex);
        
        if (exportDefaultMatch) {
          // Found named export: export default function handler() {...}
          const handlerName = exportDefaultMatch[1];
          
          // Replace the export statement
          updatedContent = updatedContent.replace(
            new RegExp(`export\\s+default(?:\\s+async)?\\s+(?:function\\s+)?${handlerName}`),
            middlewareImport + `export default withDateNormalization(${handlerName}`
          );
          
          // Find closing brace of handler function
          const lastBraceIndex = updatedContent.lastIndexOf('}');
          if (lastBraceIndex !== -1) {
            // Add closing parenthesis for withDateNormalization
            updatedContent = updatedContent.slice(0, lastBraceIndex + 1) + ')' + updatedContent.slice(lastBraceIndex + 1);
          }
          
          fs.writeFileSync(fullPath, updatedContent, 'utf8');
          console.log(`Updated API route: ${fullPath}`);
          updatedCount++;
        } else if (content.includes('export default')) {
          // Direct export: export default ...
          updatedContent = content.replace(
            /export\s+default\s+/,
            middlewareImport + 'export default withDateNormalization('
          );
          
          // Add closing parenthesis at the end
          updatedContent = updatedContent + ')';
          
          fs.writeFileSync(fullPath, updatedContent, 'utf8');
          console.log(`Updated API route: ${fullPath}`);
          updatedCount++;
        } else {
          console.log(`Could not update API route ${fullPath} - export pattern not recognized`);
        }
      }
    }
    
    return updatedCount;
  } catch (error) {
    console.error(`Error scanning ${directory}:`, error.message);
    return 0;
  }
}

const updatedApiRoutes = updateApiRoutes(apiDirectory);
console.log(`Updated ${updatedApiRoutes} API routes`);

// Find and update database client
function findDatabaseClient() {
  // Common database clients to look for
  const dbClients = [
    'PrismaClient',
    'mongoose',
    'Sequelize',
    'knex',
    'typeorm'
  ];
  
  // Directories to scan
  const dirsToScan = [
    './lib',
    './src/lib',
    './utils',
    './src/utils',
    './db',
    './src/db',
    './database',
    './src/database',
    './prisma',
    './src/prisma'
  ];
  
  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;
    
    console.log(`Scanning ${dir} for database clients...`);
    
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
        
        const fullPath = path.join(dir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if file contains any of the database clients
        const foundClient = dbClients.find(client => content.includes(client));
        
        if (foundClient) {
          console.log(`Found database client ${foundClient} in ${fullPath}`);
          
          // Skip if already patched
          if (content.includes('databasePatch')) {
            console.log(`Database client already patched in ${fullPath}`);
            return true;
          }
          
          // Create backup
          fs.writeFileSync(`${fullPath}.bak`, content, 'utf8');
          
          // Add import
          const importPath = path.relative(path.dirname(fullPath), './lib/databasePatch')
            .replace(/\\/g, '/');
          
          const dbPatchImport = `import { patchDatabaseClient } from '${importPath}';\n\n`;
          
          // Add patch code
          let updatedContent = dbPatchImport + content;
          
          // Find export statement
          const exportRegex = /export\s+(?:const|let|var)?\s*(\w+)\s*=\s*new\s+(\w+)/;
          const exportMatch = content.match(exportRegex);
          
          if (exportMatch) {
            // Found export of client
            const varName = exportMatch[1];
            
            // Replace direct export with variable declaration
            updatedContent = updatedContent.replace(
              new RegExp(`export\\s+(?:const|let|var)?\\s*${varName}\\s*=\\s*new\\s+\\w+`),
              `const ${varName} = new ${foundClient}`
            );
            
            // Add export of patched client at the end
            updatedContent += `\n\nconst patched${varName} = patchDatabaseClient(${varName});\nexport default patched${varName};\n`;
          } else if (content.includes(`export`)) {
            // Add note at the end
            updatedContent += `\n\n// TODO: Manually patch your database client with patchDatabaseClient\n`;
            updatedContent += `// Example: const patchedClient = patchDatabaseClient(yourClientInstance);\n`;
          }
          
          fs.writeFileSync(fullPath, updatedContent, 'utf8');
          console.log(`Updated database client in ${fullPath}`);
          return true;
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error.message);
    }
  }
  
  console.log('Could not find database client file. You\'ll need to manually patch it.');
  return false;
}

findDatabaseClient();

console.log('Setup script completed.');
EOF

# Update package.json to add scripts
echo -e "${GREEN}Updating package.json...${NC}"

# Create temporary script to update package.json
cat > ./patches/update-package.js << 'EOF'
const fs = require('fs');

// Read package.json
if (!fs.existsSync('./package.json')) {
  console.log('package.json not found');
  process.exit(1);
}

let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
} catch (error) {
  console.error('Error parsing package.json:', error.message);
  process.exit(1);
}

// Create backup
fs.writeFileSync('./package.json.bak', JSON.stringify(packageJson, null, 2), 'utf8');

// Add scripts
if (!packageJson.scripts) {
  packageJson.scripts = {};
}

packageJson.scripts['vercel-diagnostic'] = 'node ./scripts/vercel-diagnostic.js';
packageJson.scripts['fix-date-error'] = 'node ./patches/fix-toISOString.js';
packageJson.scripts['setup-date-fix'] = 'node ./patches/setup-app.js';

// Update build script to run diagnostic first
if (packageJson.scripts.build) {
  packageJson.scripts.build = `npm run vercel-diagnostic && ${packageJson.scripts.build}`;
}

// Write updated package.json
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2), 'utf8');
console.log('Updated package.json with date fix scripts');
EOF

# Create instructions file
echo -e "${GREEN}Creating instructions file...${NC}"
cat > ./VERCEL_DATE_FIX.md << 'EOF'
# Vercel Date Normalization Fix

This fix addresses the "TypeError: e.toISOString is not a function" error that occurs in Vercel deployments but not locally. This problem happens because of differences in how dates are handled between environments.

## Automated Setup

Run these commands to automatically set up the fix:

```bash
# Set up application entry points and API routes
npm run setup-date-fix

# If you've already built your app, fix the built JS files
npm run fix-date-error

# Run diagnostics to test the fix
npm run vercel-diagnostic