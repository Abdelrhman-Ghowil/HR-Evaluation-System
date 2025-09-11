#!/bin/bash

# Deployment script for HR Evaluation System
# This script ensures proper environment variables are set for production build

echo "Setting up production environment variables..."
export VITE_API_BASE_URL="https://hr-eval-sys.vercel.app"
export VITE_APP_ENV="production"
export VITE_API_TIMEOUT="10000"

echo "Building application with production settings..."
npm run build

echo "Build completed successfully!"
echo "Environment variables used:"
echo "VITE_API_BASE_URL: $VITE_API_BASE_URL"
echo "VITE_APP_ENV: $VITE_APP_ENV"
echo "VITE_API_TIMEOUT: $VITE_API_TIMEOUT"