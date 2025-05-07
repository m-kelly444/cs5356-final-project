import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';/**
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
