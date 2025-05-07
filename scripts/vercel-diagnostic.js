import { useState, useEffect } from 'react';
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
// TODO: Manually add suppressHydrationWarning to elements with dates
// TODO: Manually add suppressHydrationWarning to elements with dates
