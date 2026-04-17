#!/bin/bash
# Railway build + start script
# 1. Build React frontend
# 2. Start Python API server

set -e

echo "[build] Installing frontend dependencies..."
cd Dashboard/frontend
npm install --production=false
echo "[build] Building React frontend..."
npm run build
cd ../..

echo "[build] Starting Python server..."
cd Dashboard
exec python3 app.py
