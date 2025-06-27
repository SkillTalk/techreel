#!/bin/bash

echo "📁 Navigating to frontend..."
cd ~/techreel/frontend || exit

echo "🧹 Removing old build..."
rm -rf build

echo "🏗️  Building frontend..."
npm run build

echo "🗑️  Cleaning old frontend build in backend..."
rm -rf ../backend/frontend_build

echo "🚚 Moving new build to backend..."
mv build ../backend/frontend_build

echo "✅ Done!"

