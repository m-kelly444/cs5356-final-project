#!/bin/bash

echo "🧹 Removing npm artifacts..."
rm -f package-lock.json
rm -f .npmrc

echo "🔁 Reinitializing lockfile with pnpm..."
pnpm install

echo "📌 Creating .npmrc to declare pnpm version..."
PNPM_VERSION=$(pnpm -v)
echo "packageManager=pnpm@$PNPM_VERSION" > .npmrc

echo "📦 Adding files to git..."
git add pnpm-lock.yaml .npmrc
git commit -m "Revert to pnpm as primary package manager"

echo "🚀 Pushing to origin..."
git push origin main

echo "✅ Project is now fully configured to use pnpm."
