import { useState, useEffect } from 'react';/**
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
