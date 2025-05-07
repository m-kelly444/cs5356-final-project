#!/bin/bash

# Next.js Auth Routes Diagnostic Script
# This script helps diagnose 404 issues with Next.js auth routes on Vercel

# Set output colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Next.js Auth Routes Diagnostic Tool ===${NC}"
echo "This script will check your project for common issues that cause 404 errors in auth routes."
echo

# Check if this is a Next.js project
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Please run this script from your Next.js project root.${NC}"
  exit 1
fi

# Check Next.js version
NEXT_VERSION=$(grep -m 1 '"next"' package.json | grep -o '"[0-9]*\.[0-9]*\.[0-9]*"' | tr -d '"')
if [ -z "$NEXT_VERSION" ]; then
  echo -e "${RED}Could not determine Next.js version from package.json${NC}"
else
  NEXT_MAJOR=$(echo $NEXT_VERSION | cut -d. -f1)
  NEXT_MINOR=$(echo $NEXT_VERSION | cut -d. -f2)
  echo -e "Next.js version: ${GREEN}$NEXT_VERSION${NC}"
  
  if [ "$NEXT_MAJOR" -ge 13 ]; then
    echo -e "${YELLOW}You're using Next.js 13+, which supports both Pages Router and App Router.${NC}"
  else
    echo -e "${YELLOW}You're using Next.js $NEXT_MAJOR, which uses the Pages Router.${NC}"
  fi
fi

# Check authentication libraries
echo -e "\n${BLUE}Checking authentication libraries:${NC}"

if grep -q '"next-auth"' package.json; then
  NEXTAUTH_VERSION=$(grep -m 1 '"next-auth"' package.json | grep -o '"[0-9]*\.[0-9]*\.[0-9]*"' | tr -d '"')
  echo -e "Found ${GREEN}next-auth${NC} version $NEXTAUTH_VERSION"
  USING_NEXTAUTH=true
elif grep -q '"@auth/*"' package.json; then
  echo -e "Found ${GREEN}@auth/*${NC} packages"
  USING_AUTH=true
else
  echo -e "${YELLOW}No standard auth libraries detected. Using custom auth?${NC}"
fi

# Detect router type (Pages or App)
echo -e "\n${BLUE}Detecting router type:${NC}"
if [ -d "app" ]; then
  echo -e "Found ${GREEN}app${NC} directory - App Router detected"
  ROUTER_TYPE="app"
  
  # Check for API routes in App Router
  if [ -d "app/api" ]; then
    echo -e "Found ${GREEN}app/api${NC} directory"
    
    # Check auth routes structure
    if [ -d "app/api/auth" ]; then
      echo -e "Found ${GREEN}app/api/auth${NC} directory"
      
      # Check for [...nextauth] route handler
      if [ -d "app/api/auth/[...nextauth]" ]; then
        if [ -f "app/api/auth/[...nextauth]/route.js" ] || [ -f "app/api/auth/[...nextauth]/route.ts" ]; then
          echo -e "${GREEN}✓ Found correct NextAuth route handler in app/api/auth/[...nextauth]/route.js or route.ts${NC}"
        else
          echo -e "${RED}Error: Missing route.js or route.ts file in app/api/auth/[...nextauth] directory${NC}"
          echo -e "${YELLOW}Fix: Create a route.js or route.ts file with proper exports for GET and POST handlers${NC}"
        fi
      else
        echo -e "${RED}Warning: Missing [...nextauth] directory in app/api/auth/${NC}"
        echo -e "${YELLOW}Fix: Create app/api/auth/[...nextauth]/route.js or route.ts with proper API route handlers${NC}"
      fi
    else
      echo -e "${RED}Warning: No app/api/auth directory found${NC}"
    fi
  else
    echo -e "${YELLOW}No app/api directory found. Are you using API routes?${NC}"
  fi
elif [ -d "pages" ]; then
  echo -e "Found ${GREEN}pages${NC} directory - Pages Router detected"
  ROUTER_TYPE="pages"
  
  # Check for API routes in Pages Router
  if [ -d "pages/api" ]; then
    echo -e "Found ${GREEN}pages/api${NC} directory"
    
    # Check auth routes structure
    if [ -d "pages/api/auth" ]; then
      echo -e "Found ${GREEN}pages/api/auth${NC} directory"
      
      # Check for [...nextauth].js route handler
      if [ -f "pages/api/auth/[...nextauth].js" ] || [ -f "pages/api/auth/[...nextauth].ts" ]; then
        echo -e "${GREEN}✓ Found correct NextAuth route handler in pages/api/auth/[...nextauth].js or .ts${NC}"
      else
        echo -e "${RED}Error: Missing [...nextauth].js or .ts file in pages/api/auth/ directory${NC}"
        echo -e "${YELLOW}Fix: Create pages/api/auth/[...nextauth].js or .ts with proper NextAuth configuration${NC}"
      fi
    else
      echo -e "${RED}Warning: No pages/api/auth directory found${NC}"
    fi
  else
    echo -e "${YELLOW}No pages/api directory found. Are you using API routes?${NC}"
  fi
else
  echo -e "${RED}Could not determine router type. Neither app/ nor pages/ directory found.${NC}"
fi

# Check middleware
echo -e "\n${BLUE}Checking middleware configuration:${NC}"
if [ -f "middleware.js" ] || [ -f "middleware.ts" ]; then
  echo -e "${YELLOW}Middleware file found at root level. Checking content...${NC}"
  
  if [ -f "middleware.js" ]; then
    MIDDLEWARE_FILE="middleware.js"
  else
    MIDDLEWARE_FILE="middleware.ts"
  fi
  
  # Check if middleware might be blocking auth routes
  if grep -q "/api/auth" "$MIDDLEWARE_FILE"; then
    echo -e "${GREEN}Middleware references /api/auth paths${NC}"
  else
    if grep -q "matcher" "$MIDDLEWARE_FILE"; then
      echo -e "${YELLOW}Middleware uses matcher configuration. Verify it's not blocking auth routes.${NC}"
    else
      echo -e "${YELLOW}Middleware might be applying to all routes. Consider adding a matcher to exclude auth routes.${NC}"
      echo -e "${YELLOW}Fix: Add 'export const config = { matcher: [\"/((?!api/auth).*)\"]}' to exclude auth routes.${NC}"
    fi
  fi
elif [ -f "src/middleware.js" ] || [ -f "src/middleware.ts" ]; then
  echo -e "${YELLOW}Middleware file found in src/ directory. Checking content...${NC}"
  
  if [ -f "src/middleware.js" ]; then
    MIDDLEWARE_FILE="src/middleware.js"
  else
    MIDDLEWARE_FILE="src/middleware.ts"
  fi
  
  # Check if middleware might be blocking auth routes
  if grep -q "/api/auth" "$MIDDLEWARE_FILE"; then
    echo -e "${GREEN}Middleware references /api/auth paths${NC}"
  else
    if grep -q "matcher" "$MIDDLEWARE_FILE"; then
      echo -e "${YELLOW}Middleware uses matcher configuration. Verify it's not blocking auth routes.${NC}"
    else
      echo -e "${YELLOW}Middleware might be applying to all routes. Consider adding a matcher to exclude auth routes.${NC}"
      echo -e "${YELLOW}Fix: Add 'export const config = { matcher: [\"/((?!api/auth).*)\"]}' to exclude auth routes.${NC}"
    fi
  fi
else
  echo -e "No middleware file found at root or src/ level. Skipping middleware check."
fi

# Check environment variables
echo -e "\n${BLUE}Checking environment variables:${NC}"
if [ -f ".env.local" ] || [ -f ".env" ]; then
  ENV_FILE=".env.local"
  if [ ! -f ".env.local" ]; then
    ENV_FILE=".env"
  fi
  
  if grep -q "NEXTAUTH_URL" "$ENV_FILE"; then
    echo -e "${GREEN}✓ NEXTAUTH_URL is defined in $ENV_FILE${NC}"
  else
    echo -e "${RED}Warning: NEXTAUTH_URL is not defined in $ENV_FILE${NC}"
    echo -e "${YELLOW}Fix: Add NEXTAUTH_URL=https://yourdomain.vercel.app to $ENV_FILE${NC}"
    echo -e "${YELLOW}Also add this as an environment variable in your Vercel dashboard!${NC}"
  fi
else
  echo -e "${RED}No .env or .env.local file found. You should create one with the required environment variables.${NC}"
  echo -e "${YELLOW}Fix: Create .env.local with NEXTAUTH_URL=https://yourdomain.vercel.app${NC}"
  echo -e "${YELLOW}Also add your environment variables in your Vercel dashboard!${NC}"
fi

# Check vercel.json if it exists
echo -e "\n${BLUE}Checking Vercel configuration:${NC}"
if [ -f "vercel.json" ]; then
  echo -e "Found ${GREEN}vercel.json${NC} file"
  
  # Check for custom rewrites or redirects that might affect auth routes
  if grep -q "\"rewrites\"" "vercel.json"; then
    echo -e "${YELLOW}vercel.json contains rewrites. Verify they don't conflict with auth routes.${NC}"
  fi
  
  if grep -q "\"redirects\"" "vercel.json"; then
    echo -e "${YELLOW}vercel.json contains redirects. Verify they don't conflict with auth routes.${NC}"
  fi
else
  echo -e "No vercel.json file found. Using default configuration (this is usually fine)."
fi

# Summary and suggestions
echo -e "\n${BLUE}=== Diagnostic Summary ===${NC}"

if [ "$ROUTER_TYPE" == "app" ]; then
  echo -e "1. ${YELLOW}For App Router, ensure auth routes use the route.js/route.ts format:${NC}"
  echo -e "   app/api/auth/[...nextauth]/route.js or route.ts"
  echo -e "   Make sure it exports proper GET and POST functions"
  echo
  echo -e "   Example for App Router:"
  echo -e "   // app/api/auth/[...nextauth]/route.js"
  echo -e "   import NextAuth from 'next-auth';"
  echo -e "   import { options } from './options';"
  echo -e "   const handler = NextAuth(options);"
  echo -e "   export { handler as GET, handler as POST };"
elif [ "$ROUTER_TYPE" == "pages" ]; then
  echo -e "1. ${YELLOW}For Pages Router, ensure your auth route is set up correctly:${NC}"
  echo -e "   pages/api/auth/[...nextauth].js or .ts"
  echo -e "   (not in a folder - file should directly handle the dynamic route)"
  echo
  echo -e "   Example for Pages Router:"
  echo -e "   // pages/api/auth/[...nextauth].js"
  echo -e "   import NextAuth from 'next-auth';"
  echo -e "   export default NextAuth({ /* config */ });"
fi

echo -e "2. ${YELLOW}Environment variables:${NC}"
echo -e "   - Make sure NEXTAUTH_URL is set in your Vercel dashboard"
echo -e "   - For local development, set NEXTAUTH_URL in .env.local"
echo

echo -e "3. ${YELLOW}Middleware considerations:${NC}"
echo -e "   - If using middleware, exclude auth routes with a matcher:"
echo -e "     export const config = { matcher: ['/((?!api/auth).*)'] };"
echo

echo -e "4. ${YELLOW}Check Vercel logs:${NC}"
echo -e "   - Run 'vercel logs <deployment-id>' to see detailed error logs"
echo -e "   - Look for specific errors in the auth routes"
echo

echo -e "${BLUE}=== Quick Fix Actions ===${NC}"

# Create middleware fix
if [ -f "middleware.js" ] || [ -f "middleware.ts" ] || [ -f "src/middleware.js" ] || [ -f "src/middleware.ts" ]; then
  echo -e "Would you like to automatically update your middleware to exclude auth routes? (y/n)"
  read -p "> " update_middleware
  
  if [ "$update_middleware" == "y" ] || [ "$update_middleware" == "Y" ]; then
    # Determine middleware file
    if [ -f "middleware.js" ]; then MIDDLEWARE_FILE="middleware.js"
    elif [ -f "middleware.ts" ]; then MIDDLEWARE_FILE="middleware.ts"
    elif [ -f "src/middleware.js" ]; then MIDDLEWARE_FILE="src/middleware.js"
    elif [ -f "src/middleware.ts" ]; then MIDDLEWARE_FILE="src/middleware.ts"
    fi
    
    # Check if matcher already exists and update it
    if grep -q "export const config" "$MIDDLEWARE_FILE"; then
      # Matcher exists, but we need to check if it excludes auth routes
      if ! grep -q "api/auth" "$MIDDLEWARE_FILE"; then
        echo "Updating existing matcher configuration..."
        # This is a simple approach - in a real script, you might need more sophisticated regex
        # to handle different matcher formats correctly
        cp "$MIDDLEWARE_FILE" "$MIDDLEWARE_FILE.bak"
        sed -i 's/export const config = { matcher: \[/export const config = { matcher: \[\"\/\((?!api\/auth).*\)\",/' "$MIDDLEWARE_FILE"
        echo -e "${GREEN}Updated middleware matcher. Original file backed up as $MIDDLEWARE_FILE.bak${NC}"
      else
        echo -e "${GREEN}Middleware already appears to handle auth routes correctly.${NC}"
      fi
    else
      # No matcher exists, add one at the end of the file
      echo "Adding matcher configuration to exclude auth routes..."
      cp "$MIDDLEWARE_FILE" "$MIDDLEWARE_FILE.bak"
      echo -e "\n// Add matcher to exclude auth routes\nexport const config = { matcher: ['/((?!api/auth).*)'] };" >> "$MIDDLEWARE_FILE"
      echo -e "${GREEN}Added middleware matcher. Original file backed up as $MIDDLEWARE_FILE.bak${NC}"
    fi
  fi
fi

# Create auth directories and files if they don't exist
if [ "$ROUTER_TYPE" == "app" ] && [ "$USING_NEXTAUTH" == "true" ]; then
  if [ ! -d "app/api/auth/[...nextauth]" ]; then
    echo -e "Would you like to create the necessary files for NextAuth in App Router? (y/n)"
    read -p "> " create_nextauth
    
    if [ "$create_nextauth" == "y" ] || [ "$create_nextauth" == "Y" ]; then
      mkdir -p "app/api/auth/[...nextauth]"
      echo -e "${GREEN}Created app/api/auth/[...nextauth] directory${NC}"
      
      cat > "app/api/auth/[...nextauth]/route.js" << 'EOL'
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Configure your auth providers here
const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your authentication logic here
        if (credentials.username === "user" && credentials.password === "password") {
          return { id: "1", name: "User", email: "user@example.com" };
        }
        return null;
      }
    }),
  ],
  // Add your NextAuth configuration here
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};

// Create the handler using the authOptions
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
export { handler as GET, handler as POST };
EOL
      echo -e "${GREEN}Created basic NextAuth configuration in app/api/auth/[...nextauth]/route.js${NC}"
      echo -e "${YELLOW}Remember to customize this file with your actual auth configuration!${NC}"
    fi
  fi
elif [ "$ROUTER_TYPE" == "pages" ] && [ "$USING_NEXTAUTH" == "true" ]; then
  if [ ! -f "pages/api/auth/[...nextauth].js" ] && [ ! -f "pages/api/auth/[...nextauth].ts" ]; then
    echo -e "Would you like to create the necessary files for NextAuth in Pages Router? (y/n)"
    read -p "> " create_nextauth
    
    if [ "$create_nextauth" == "y" ] || [ "$create_nextauth" == "Y" ]; then
      mkdir -p "pages/api/auth"
      echo -e "${GREEN}Created pages/api/auth directory${NC}"
      
      cat > "pages/api/auth/[...nextauth].js" << 'EOL'
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Configure your auth providers and options
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add your authentication logic here
        if (credentials.username === "user" && credentials.password === "password") {
          return { id: "1", name: "User", email: "user@example.com" };
        }
        return null;
      }
    }),
  ],
  // Add your NextAuth configuration here
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
};

export default NextAuth(authOptions);
EOL
      echo -e "${GREEN}Created basic NextAuth configuration in pages/api/auth/[...nextauth].js${NC}"
      echo -e "${YELLOW}Remember to customize this file with your actual auth configuration!${NC}"
    fi
  fi
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
  echo -e "Would you like to create a .env.local file with NextAuth environment variables? (y/n)"
  read -p "> " create_env
  
  if [ "$create_env" == "y" ] || [ "$create_env" == "Y" ]; then
    cat > ".env.local" << 'EOL'
# NextAuth environment variables
NEXTAUTH_URL=http://localhost:3000
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET=your-secret-key-change-this-in-production

# Add your other environment variables here
EOL
    echo -e "${GREEN}Created .env.local file with basic NextAuth environment variables${NC}"
    echo -e "${YELLOW}Remember to update the values and add them to your Vercel dashboard too!${NC}"
  fi
fi

echo -e "\n${BLUE}=== Diagnostic Complete ===${NC}"
echo -e "Remember to check your Vercel environment variables and deploy after making changes."
echo -e "If you're still having issues, check the Vercel logs and consider a new deployment."