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
