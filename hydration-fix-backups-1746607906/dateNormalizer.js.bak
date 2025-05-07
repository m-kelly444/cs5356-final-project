import { useState, useEffect } from 'react';
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
