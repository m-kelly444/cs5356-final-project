#!/bin/bash

# Complete Database Reset and Setup Script for Neon PostgreSQL
# This script will:
# 1. Delete all preexisting tables from Neon database
# 2. Run pnpm generate and migrate for Prisma
# 3. Ensure all generated files are in the right places
# 4. Fix any date format issues

echo "🔄 Complete Neon Database Reset and Setup"
echo "========================================"

# Colors for better output readability
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to prompt for information with a default value
prompt_with_default() {
  local prompt="$1"
  local default="$2"
  local result=""
  
  if [ -z "$default" ]; then
    # No default, require an answer
    while [ -z "$result" ]; do
      read -p "$prompt: " result
      if [ -z "$result" ]; then
        echo -e "${RED}This field is required.${NC}"
      fi
    done
  else
    # With default, allow empty answer
    read -p "$prompt [$default]: " result
    if [ -z "$result" ]; then
      result="$default"
    fi
  fi
  
  echo "$result"
}

# Get DATABASE_URL from .env file if it exists
if [ -f "./.env" ]; then
  ENV_DB_URL=$(grep -o "DATABASE_URL=.*" ./.env | sed 's/DATABASE_URL=//' | tr -d '"' | tr -d "'")
  if [ -n "$ENV_DB_URL" ]; then
    DEFAULT_DB_URL=$ENV_DB_URL
    echo -e "${BLUE}Found DATABASE_URL in .env file${NC}"
  fi
fi

# Prompt for Neon connection string
echo -e "\n${YELLOW}Database Connection Setup${NC}"
echo -e "This script needs your Neon PostgreSQL connection information."

# If we don't have a default, provide an example
if [ -z "$DEFAULT_DB_URL" ]; then
  echo -e "${BLUE}Example: postgresql://user:password@hostname:5432/database${NC}"
  NEON_DB_URL=$(prompt_with_default "Enter your Neon PostgreSQL connection URL" "")
else
  NEON_DB_URL=$(prompt_with_default "Enter your Neon PostgreSQL connection URL" "$DEFAULT_DB_URL")
fi

# Extract DB info from the connection string
DB_HOST=$(echo $NEON_DB_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_NAME=$(echo $NEON_DB_URL | sed -n 's/.*\/\(.*\)$/\1/p' | sed 's/?.*//')
DB_USER=$(echo $NEON_DB_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
DB_PASS=$(echo $NEON_DB_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
DB_PORT=$(echo $NEON_DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

# Confirm extracted database information
echo -e "\n${BLUE}Extracted database information:${NC}"
echo -e "  Host: $DB_HOST"
echo -e "  Database: $DB_NAME"
echo -e "  User: $DB_USER"
echo -e "  Port: $DB_PORT"
echo -e "  Password: [hidden]"

CONFIRM=$(prompt_with_default "Is this information correct? (y/n)" "y")
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
  echo -e "${RED}Please check your connection string and try again.${NC}"
  exit 1
fi

# Prompt for Node environment
echo -e "\n${YELLOW}Project Environment Setup${NC}"
NODE_ENV=$(prompt_with_default "Enter the Node environment (development, production, test)" "development")

# Prompt for backup
echo -e "\n${YELLOW}Database Backup${NC}"
CREATE_BACKUP=$(prompt_with_default "Create a backup before proceeding? (y/n)" "y")

# Setup backup directory if needed
if [[ "$CREATE_BACKUP" == "y" || "$CREATE_BACKUP" == "Y" ]]; then
  BACKUP_DIR="./db_backup_$(date +%Y%m%d_%H%M%S)"
  mkdir -p $BACKUP_DIR
  echo -e "📁 Created backup directory: $BACKUP_DIR"
else
  BACKUP_DIR=""
fi

# Function to detect project structure and ORM
detect_project_structure() {
  echo -e "\n${YELLOW}Detecting project structure...${NC}"
  
  # Check for package manager
  if [ -f "./pnpm-lock.yaml" ]; then
    PACKAGE_MANAGER="pnpm"
    echo -e "${GREEN}✅ Detected pnpm as package manager${NC}"
  elif [ -f "./yarn.lock" ]; then
    PACKAGE_MANAGER="yarn"
    echo -e "${GREEN}✅ Detected yarn as package manager${NC}"
  elif [ -f "./package-lock.json" ]; then
    PACKAGE_MANAGER="npm"
    echo -e "${GREEN}✅ Detected npm as package manager${NC}"
  else
    echo -e "${YELLOW}⚠️ No lock file found${NC}"
    PACKAGE_MANAGER=$(prompt_with_default "Enter your package manager (pnpm, yarn, npm)" "pnpm")
  fi
  
  # Check for ORM
  if [ -f "./prisma/schema.prisma" ]; then
    ORM_TYPE="prisma"
    echo -e "${GREEN}✅ Detected Prisma ORM${NC}"
  else
    echo -e "${YELLOW}⚠️ Could not detect Prisma schema${NC}"
    CONFIRM=$(prompt_with_default "Are you using Prisma ORM? (y/n)" "y")
    if [[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]]; then
      ORM_TYPE="prisma"
      
      # Ask if they want to create a basic schema if none exists
      if [ ! -f "./prisma/schema.prisma" ]; then
        CREATE_SCHEMA=$(prompt_with_default "No schema.prisma found. Create a basic one? (y/n)" "y")
        if [[ "$CREATE_SCHEMA" == "y" || "$CREATE_SCHEMA" == "Y" ]]; then
          mkdir -p "./prisma"
          cat > "./prisma/schema.prisma" << EOL
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add your models here
// Example:
// model User {
//   id        Int      @id @default(autoincrement())
//   createdAt DateTime @default(now())
//   email     String   @unique
//   name      String?
// }
EOL
          echo -e "${GREEN}✅ Created basic schema.prisma file${NC}"
        fi
      fi
    else
      echo -e "${RED}This script is designed for Prisma with Neon. Cannot continue.${NC}"
      exit 1
    fi
  fi
  
  # Check for Next.js
  if grep -q "next" "./package.json"; then
    IS_NEXTJS=true
    echo -e "${GREEN}✅ Detected Next.js project${NC}"
    
    # Check if using app router
    if [ -d "./app" ]; then
      NEXT_ROUTER="app"
      echo -e "${BLUE}Using Next.js App Router${NC}"
    else
      NEXT_ROUTER="pages"
      echo -e "${BLUE}Using Next.js Pages Router${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️ Could not detect Next.js${NC}"
    CONFIRM=$(prompt_with_default "Are you using Next.js? (y/n)" "y")
    if [[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]]; then
      IS_NEXTJS=true
      NEXT_ROUTER=$(prompt_with_default "Which router are you using? (app/pages)" "app")
    else
      IS_NEXTJS=false
    fi
  fi
}

# Function to backup the Neon database
backup_database() {
  if [ -z "$BACKUP_DIR" ]; then
    echo -e "\n${YELLOW}Skipping database backup as requested...${NC}"
    return 0
  fi
  
  echo -e "\n${YELLOW}Creating database backup from Neon...${NC}"
  
  # Check if pg_dump is installed
  if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found. Can't create a backup.${NC}"
    echo -e "${YELLOW}Please install PostgreSQL client tools to enable backups.${NC}"
    
    CONTINUE=$(prompt_with_default "Do you want to continue without a backup? (y/n)" "n")
    if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
      echo -e "${RED}Exiting to allow you to install PostgreSQL tools${NC}"
      exit 1
    else
      return 0
    fi
  fi
  
  # Create .pgpass file for passwordless connection
  echo "${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:${DB_PASS}" > ~/.pgpass
  chmod 600 ~/.pgpass
  
  # Run pg_dump with the connection string
  echo -e "${BLUE}Running pg_dump to backup Neon database...${NC}"
  pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/neon_backup.dump"
  
  # Check if backup was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Backup failed.${NC}"
    
    # Ask to continue
    CONTINUE=$(prompt_with_default "Do you want to continue without a backup? (y/n)" "n")
    if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
      # Cleanup and exit
      rm ~/.pgpass
      echo -e "${RED}Exiting at your request.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}✅ Neon database backed up to $BACKUP_DIR/neon_backup.dump${NC}"
  fi
  
  # Cleanup
  rm ~/.pgpass
}

# Function to drop all tables in the Neon database
drop_all_tables() {
  echo -e "\n${YELLOW}Database Reset${NC}"
  echo -e "${RED}WARNING: This will DELETE ALL TABLES in your Neon database!${NC}"
  CONFIRM=$(prompt_with_default "Are you sure you want to continue? (y/n)" "n")
  
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo -e "${RED}Operation cancelled.${NC}"
    exit 1
  fi
  
  echo -e "\n${YELLOW}Dropping all existing tables in Neon database...${NC}"
  
  if [ "$ORM_TYPE" == "prisma" ]; then
    echo -e "${BLUE}Using Prisma to reset the database...${NC}"
    
    # For Prisma, use migrate reset (preferred method)
    if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
      echo -e "${BLUE}Running: pnpm prisma migrate reset --force${NC}"
      DATABASE_URL=$NEON_DB_URL pnpm prisma migrate reset --force
      
      # Check if the command succeeded
      if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Prisma migrate reset failed. Trying manual approach...${NC}"
        USE_MANUAL=true
      else
        echo -e "${GREEN}✅ Prisma database reset complete${NC}"
        return 0
      fi
    else
      echo -e "${BLUE}Running: npx prisma migrate reset --force${NC}"
      DATABASE_URL=$NEON_DB_URL npx prisma migrate reset --force
      
      # Check if the command succeeded
      if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Prisma migrate reset failed. Trying manual approach...${NC}"
        USE_MANUAL=true
      else
        echo -e "${GREEN}✅ Prisma database reset complete${NC}"
        return 0
      fi
    fi
  else
    USE_MANUAL=true
  fi
  
  # If Prisma's reset fails or we're not using Prisma, manually drop all tables
  if [ "$USE_MANUAL" = true ]; then
    echo -e "${BLUE}Manually dropping all tables in Neon database...${NC}"
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
      echo -e "${RED}❌ psql not found. Can't manually drop tables.${NC}"
      echo -e "${YELLOW}Please install PostgreSQL client tools.${NC}"
      exit 1
    fi
    
    # Create temporary file for PostgreSQL commands
    TEMP_SQL=$(mktemp)
    
    # Create .pgpass file for passwordless connection
    echo "${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:${DB_PASS}" > ~/.pgpass
    chmod 600 ~/.pgpass
    
    # Get the list of all tables and create DROP statements
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT 'DROP TABLE IF EXISTS \"' || tablename || '\" CASCADE;' FROM pg_tables WHERE schemaname = 'public';" > $TEMP_SQL
    
    # Execute the DROP statements
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $TEMP_SQL
    
    # Cleanup
    rm $TEMP_SQL
    rm ~/.pgpass
    
    echo -e "${GREEN}✅ All tables dropped from Neon database${NC}"
  fi
}

# Function to run Prisma generation and migration
run_prisma_commands() {
  echo -e "\n${YELLOW}Running Prisma generation and migration commands...${NC}"
  
  # Check if we have a schema file
  if [ ! -f "./prisma/schema.prisma" ]; then
    echo -e "${RED}❌ Prisma schema file not found. Cannot continue with Prisma commands.${NC}"
    echo -e "${YELLOW}Please make sure you have a valid schema.prisma file in the prisma directory.${NC}"
    return 1
  fi
  
  # Run prisma generate
  if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
    echo -e "${BLUE}Running: pnpm prisma generate${NC}"
    DATABASE_URL=$NEON_DB_URL pnpm prisma generate
  else
    echo -e "${BLUE}Running: npx prisma generate${NC}"
    DATABASE_URL=$NEON_DB_URL npx prisma generate
  fi
  
  # Check if generate was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed. Please check your schema file.${NC}"
    
    CONTINUE=$(prompt_with_default "Do you want to continue anyway? (y/n)" "n")
    if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
      exit 1
    fi
  else
    echo -e "${GREEN}✅ Prisma generate completed successfully${NC}"
  fi
  
  # Ask for migration name
  MIGRATION_NAME=$(prompt_with_default "Enter a name for the migration" "initial")
  
  # Run prisma migrate
  if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
    echo -e "${BLUE}Running: pnpm prisma migrate dev --name $MIGRATION_NAME${NC}"
    DATABASE_URL=$NEON_DB_URL pnpm prisma migrate dev --name $MIGRATION_NAME
  else
    echo -e "${BLUE}Running: npx prisma migrate dev --name $MIGRATION_NAME${NC}"
    DATABASE_URL=$NEON_DB_URL npx prisma migrate dev --name $MIGRATION_NAME
  fi
  
  # Check if migrate was successful
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma migrate failed. Please check your schema file and database connection.${NC}"
    
    CONTINUE=$(prompt_with_default "Do you want to continue anyway? (y/n)" "n")
    if [[ "$CONTINUE" != "y" && "$CONTINUE" != "Y" ]]; then
      exit 1
    fi
  else
    echo -e "${GREEN}✅ Prisma migrate completed successfully${NC}"
  fi
  
  return 0
}

# Function to ensure generated files are in the right places
ensure_generated_files() {
  echo -e "\n${YELLOW}Ensuring generated files are in the right places...${NC}"
  
  # Check for Prisma client
  if [ ! -d "./node_modules/.prisma" ] || [ ! -d "./node_modules/@prisma/client" ]; then
    echo -e "${YELLOW}⚠️ Prisma client not found or incomplete, regenerating...${NC}"
    
    REGEN=$(prompt_with_default "Regenerate Prisma client? (y/n)" "y")
    if [[ "$REGEN" == "y" || "$REGEN" == "Y" ]]; then
      if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
        DATABASE_URL=$NEON_DB_URL pnpm prisma generate
      else
        DATABASE_URL=$NEON_DB_URL npx prisma generate
      fi
    fi
  fi
  
  # For Next.js projects, ensure Prisma is properly initialized
  if [ "$IS_NEXTJS" = true ]; then
    echo -e "${BLUE}Checking Prisma setup for Next.js...${NC}"
    
    # Check for lib/prisma.ts or similar files
    PRISMA_CLIENT_FILES=$(find . -name "prisma.js" -o -name "prisma.ts" -o -name "db.js" -o -name "db.ts")
    
    if [ -z "$PRISMA_CLIENT_FILES" ]; then
      echo -e "${YELLOW}⚠️ No Prisma client initialization file found${NC}"
      
      CREATE_CLIENT=$(prompt_with_default "Create a Prisma client initialization file? (y/n)" "y")
      if [[ "$CREATE_CLIENT" == "y" || "$CREATE_CLIENT" == "Y" ]]; then
        # Create a basic prisma client file
        mkdir -p "./lib"
        
        if grep -q "typescript" "./package.json"; then
          # TypeScript version
          cat > "./lib/prisma.ts" << 'EOL'
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOL
          echo -e "${GREEN}✅ Created Prisma client initialization at ./lib/prisma.ts${NC}"
        else
          # JavaScript version
          cat > "./lib/prisma.js" << 'EOL'
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
EOL
          echo -e "${GREEN}✅ Created Prisma client initialization at ./lib/prisma.js${NC}"
        fi
      fi
    else
      echo -e "${GREEN}✅ Found Prisma client initialization file${NC}"
    fi
  fi
  
  # Check for .env file with database config
  if [ ! -f "./.env" ] && [ ! -f "./.env.local" ]; then
    echo -e "${YELLOW}⚠️ No .env file found${NC}"
    
    CREATE_ENV=$(prompt_with_default "Create .env file with database config? (y/n)" "y")
    if [[ "$CREATE_ENV" == "y" || "$CREATE_ENV" == "Y" ]]; then
      cat > "./.env" << EOL
# Database Configuration
DATABASE_URL="${NEON_DB_URL}"

# Node Environment
NODE_ENV="${NODE_ENV}"
EOL
      echo -e "${GREEN}✅ Created .env file with database configuration${NC}"
    fi
  else
    # Check if DATABASE_URL exists in .env
    if [ -f "./.env" ] && ! grep -q "DATABASE_URL" "./.env"; then
      echo -e "${YELLOW}⚠️ DATABASE_URL not found in .env${NC}"
      
      UPDATE_ENV=$(prompt_with_default "Add DATABASE_URL to .env file? (y/n)" "y")
      if [[ "$UPDATE_ENV" == "y" || "$UPDATE_ENV" == "Y" ]]; then
        echo "DATABASE_URL=\"${NEON_DB_URL}\"" >> "./.env"
        echo -e "${GREEN}✅ Added DATABASE_URL to .env file${NC}"
      fi
    fi
  fi
}

# Function to fix date format issues specifically for Next.js + Prisma
fix_date_formats() {
  echo -e "\n${YELLOW}Checking and fixing date format issues...${NC}"
  
  # Check for DateTime fields in Prisma schema
  if [ -f "./prisma/schema.prisma" ]; then
    DATE_FIELDS=$(grep "DateTime" "./prisma/schema.prisma" | wc -l)
    
    if [ "$DATE_FIELDS" -gt 0 ]; then
      echo -e "${BLUE}Found $DATE_FIELDS DateTime fields in Prisma schema${NC}"
      
      # Create a middleware file for date validation if it doesn't exist
      if [ ! -f "./prisma/middleware.js" ] && [ ! -f "./src/lib/prisma-middleware.js" ]; then
        echo -e "${YELLOW}⚠️ No Prisma middleware found for date validation${NC}"
        
        CREATE_MIDDLEWARE=$(prompt_with_default "Create date validation middleware for Prisma? (y/n)" "y")
        if [[ "$CREATE_MIDDLEWARE" == "y" || "$CREATE_MIDDLEWARE" == "Y" ]]; then
          mkdir -p "./src/lib"
          
          # Create middleware file
          cat > "./src/lib/prisma-middleware.js" << 'EOL'
const { PrismaClient } = require('@prisma/client');

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
EOL
          
          echo -e "${GREEN}✅ Created Prisma middleware for date validation${NC}"
        fi
      else
        echo -e "${GREEN}✅ Prisma middleware exists${NC}"
      fi
    else
      echo -e "${GREEN}✅ No DateTime fields found in Prisma schema${NC}"
    fi
  fi
  
  # If Next.js, add webpack fix for toISOString errors
  if [ "$IS_NEXTJS" = true ]; then
    echo -e "${BLUE}Checking for Next.js toISOString error fix...${NC}"
    
    # Check if next.config.js exists
    if [ -f "./next.config.js" ]; then
      echo -e "${BLUE}Found next.config.js${NC}"
      
      # Check if it already has webpack configuration
      if grep -q "webpack:" "./next.config.js"; then
        echo -e "${YELLOW}⚠️ next.config.js already has webpack configuration${NC}"
        
        # Ask if user wants to manually edit
        MANUAL_EDIT=$(prompt_with_default "Would you like to manually edit next.config.js to add the toISOString fix? (y/n)" "n")
        if [[ "$MANUAL_EDIT" == "y" || "$MANUAL_EDIT" == "Y" ]]; then
          echo -e "${BLUE}Please add the following to your webpack config in next.config.js:${NC}"
          echo -e """
if (isServer) {
  // Monkey patch to fix toISOString errors
  config.plugins.push(
    new webpack.DefinePlugin({
      \\\"Object.prototype.toISOString\\\": \\`function() { 
        try { 
          return Date.prototype.toISOString.call(this); 
        } catch(e) { 
          return new Date(this).toISOString(); 
        } 
      }\\`,
    })
  );
}
"""
          # Wait for user to edit
          read -p "Press Enter when you've updated the file..."
        fi
      else
        # Ask if they want to update
        UPDATE_CONFIG=$(prompt_with_default "Update next.config.js with toISOString error fix? (y/n)" "y")
        if [[ "$UPDATE_CONFIG" == "y" || "$UPDATE_CONFIG" == "Y" ]]; then
          # Backup the file if backup directory exists
          if [ -n "$BACKUP_DIR" ]; then
            cp "./next.config.js" "$BACKUP_DIR/next.config.js"
          fi
          
          # Add webpack configuration
          sed -i 's/module.exports = {/const webpack = require("webpack");\n\nmodule.exports = {/g' "./next.config.js"
          sed -i 's/module.exports = {/module.exports = {\n  webpack: (config, { isServer }) => {\n    if (isServer) {\n      \/\/ Monkey patch to fix toISOString errors\n      config.plugins.push(new webpack.DefinePlugin({\n        "Object.prototype.toISOString": `function() { try { return Date.prototype.toISOString.call(this); } catch(e) { return new Date(this).toISOString(); } }`,\n      }));\n    }\n    return config;\n  },/g' "./next.config.js"
          
          echo -e "${GREEN}✅ Updated next.config.js with webpack patch for toISOString errors${NC}"
        fi
      fi
    else
      echo -e "${YELLOW}⚠️ next.config.js not found${NC}"
      
      # Ask if they want to create it
      CREATE_CONFIG=$(prompt_with_default "Create next.config.js with toISOString error fix? (y/n)" "y")
      if [[ "$CREATE_CONFIG" == "y" || "$CREATE_CONFIG" == "Y" ]]; then
        # Create basic Next.js config with the fix
        cat > "./next.config.js" << 'EOL'
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Monkey patch to fix toISOString errors
      config.plugins.push(
        new webpack.DefinePlugin({
          "Object.prototype.toISOString": `function() { 
            try { 
              return Date.prototype.toISOString.call(this); 
            } catch(e) { 
              return new Date(this).toISOString(); 
            } 
          }`,
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
EOL
        
        echo -e "${GREEN}✅ Created next.config.js with toISOString error fix${NC}"
      fi
    fi
    
    # Check if webpack is installed
    if ! grep -q "\"webpack\":" "./package.json"; then
      echo -e "${YELLOW}⚠️ webpack dependency not found in package.json${NC}"
      
      # Ask if they want to install it
      INSTALL_WEBPACK=$(prompt_with_default "Install webpack as a dev dependency? (y/n)" "y")
      if [[ "$INSTALL_WEBPACK" == "y" || "$INSTALL_WEBPACK" == "Y" ]]; then
        echo -e "${BLUE}Installing webpack...${NC}"
        
        if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
          pnpm add --save-dev webpack
        elif [ "$PACKAGE_MANAGER" == "yarn" ]; then
          yarn add --dev webpack
        else
          npm install --save-dev webpack
        fi
        
        echo -e "${GREEN}✅ Installed webpack${NC}"
      fi
    fi
  fi
}

# Function to clear build cache
clear_cache() {
  echo -e "\n${YELLOW}Build Cache${NC}"
  CLEAR_CACHE=$(prompt_with_default "Clear build cache? (y/n)" "y")
  
  if [[ "$CLEAR_CACHE" != "y" && "$CLEAR_CACHE" != "Y" ]]; then
    echo -e "${BLUE}Skipping cache clearing...${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}Clearing build cache...${NC}"
  
  # Remove Next.js cache
  if [ -d "./.next" ]; then
    echo -e "${BLUE}Removing Next.js build cache...${NC}"
    rm -rf ./.next
  fi
  
  # Clear node_modules cache
  echo -e "${BLUE}Clearing node_modules cache...${NC}"
  if [ "$PACKAGE_MANAGER" == "pnpm" ]; then
    pnpm store prune
  elif [ "$PACKAGE_MANAGER" == "yarn" ]; then
    yarn cache clean
  else
    npm cache clean --force
  fi
  
  echo -e "${GREEN}✅ Cache cleared${NC}"
}

# Function to restart the server
restart_server() {
  echo -e "\n${YELLOW}Restarting server...${NC}"
  
  # Check if package.json has start script
  if grep -q "\"dev\":" "./package.json"; then
    echo -e "${BLUE}Restarting server using $PACKAGE_MANAGER run dev...${NC}"
    $PACKAGE_MANAGER run dev
  elif grep -q "\"start\":" "./package.json"; then
    echo -e "${BLUE}Restarting server using $PACKAGE_MANAGER run start...${NC}"
    $PACKAGE_MANAGER run start
  else
    echo -e "${RED}Could not find start or dev script in package.json${NC}"
    echo -e "${BLUE}Please restart your server manually${NC}"
  fi
}

# Main execution
echo -e "\n${YELLOW}Starting Neon database reset and setup process...${NC}"

# 1. Detect project structure and ORM
detect_project_structure

# 2. Backup the database
backup_database

# 3. Drop all tables from the database
drop_all_tables

# 4. Run Prisma generation and migration commands
run_prisma_commands

# 5. Ensure generated files are in the right places
ensure_generated_files

# 6. Fix date format issues
fix_date_formats

# 7. Clear cache
clear_cache

echo -e "\n${GREEN}✅ Neon database reset and setup complete!${NC}"
if [ -n "$BACKUP_DIR" ]; then
  echo -e "A backup of your original database was created in $BACKUP_DIR"
fi
echo -e "The script has:"
echo -e "  1. Reset the database by dropping all tables"
echo -e "  2. Run Prisma generation and migration commands"
echo -e "  3. Ensured all generated files are in the right places"
echo -e "  4. Fixed date format issues that could cause toISOString errors"
if [[ "$CLEAR_CACHE" == "y" || "$CLEAR_CACHE" == "Y" ]]; then
  echo -e "  5. Cleared build caches"
fi

# Ask if user wants to restart the server
echo -e "\n${YELLOW}Server Restart${NC}"
RESTART=$(prompt_with_default "Do you want to restart the server now? (y/n)" "n")

if [[ "$RESTART" == "y" || "$RESTART" == "Y" ]]; then
  restart_server
else
  echo -e "${BLUE}Please restart your server manually when ready${NC}"
fi

echo -e "\n${GREEN}Done!${NC}"