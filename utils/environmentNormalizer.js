import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';/**
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
