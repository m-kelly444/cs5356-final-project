import { useState, useEffect } from 'react';const fs = require('fs');

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
