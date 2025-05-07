#!/bin/bash

echo "🧹 Cleaning Vercel and build cache files..."

# Remove Vercel config/cache directory
rm -rf .vercel

# Remove node_modules and lock files
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Remove Next.js build output
rm -rf .next

# Remove Vite/SvelteKit build output (adjust as needed)
rm -rf dist
rm -rf build

# Remove any other temp/cache folders
rm -rf .turbo
rm -rf .cache
rm -rf .output

echo "✅ Cache cleared. Ready for fresh deployment."
