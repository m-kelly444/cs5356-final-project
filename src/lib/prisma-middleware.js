import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to validate date fields
prisma.$use(async (params, next) => {
  // For create/update operations, validate date fields
  if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
    if (params.args.data) {
      Object.keys(params.args.data).forEach(key => {
        // Check if field might be a date (by name)
        if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) && 
            params.args.data[key] !== null && 
            params.args.data[key] !== undefined) {
          
          // If it's not already a Date object, try to convert it
          if (!(params.args.data[key] instanceof Date)) {
            try {
              params.args.data[key] = new Date(params.args.data[key]);
            } catch (e) {
              console.warn(`Failed to convert ${key} to Date object, setting to null`);
              params.args.data[key] = null;
            }
          }
        }
      });
    }
  }
  
  return next(params);
});

module.exports = prisma;
