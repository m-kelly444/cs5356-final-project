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
    echo -e "${BLUE}Running: pnpm prisma migrate