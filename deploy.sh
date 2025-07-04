#!/bin/bash

# Netlify Deployment Script voor Rubix Safety Docs
echo "🚀 Starting Netlify deployment preparation..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Run type checking
echo "🔍 Running type checks..."
pnpm run type-check || echo "⚠️ Type check warnings (continuing anyway)"

# Run linting
echo "🧹 Running linter..."
pnpm run lint || echo "⚠️ Linting warnings (continuing anyway)"

# Build the project
echo "🏗️ Building project..."
pnpm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Ready for Netlify deployment."
    echo ""
    echo "📋 Deployment checklist:"
    echo "1. Push your code to GitHub"
    echo "2. Connect your GitHub repo to Netlify"
    echo "3. Set environment variables in Netlify:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "4. Deploy!"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi
