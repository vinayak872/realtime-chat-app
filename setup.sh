#!/bin/bash

# Setup script for Real-Time Chat Application

set -e

echo "======================================"
echo "Real-Time Chat Application Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Backend Setup
echo ""
echo "---------- Backend Setup ----------"
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your database credentials"
fi

echo "📦 Installing backend dependencies..."
npm install

# Check if we can create uploads directory
mkdir -p uploads
chmod 755 uploads

echo "✅ Backend setup complete!"

# Frontend Setup
echo ""
echo "---------- Frontend Setup ----------"
cd ../frontend

if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file from .env.example..."
    cp .env.example .env.local
fi

echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"

# Summary
echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Update database credentials:"
echo "   nano backend/.env"
echo ""
echo "2. Sync database:"
echo "   cd backend && npm run db:sync"
echo ""
echo "3. Start backend (Terminal 1):"
echo "   cd backend && npm run dev"
echo ""
echo "4. Start frontend (Terminal 2):"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Open browser:"
echo "   http://localhost:5173"
echo ""
