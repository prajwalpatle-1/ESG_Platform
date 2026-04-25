#!/bin/bash

# ESG MVP - Database Setup Script for Linux/Mac

echo ""
echo "========================================="
echo "ESG MVP - Database Setup"
echo "========================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "ERROR: PostgreSQL is not installed"
    echo "Please install PostgreSQL and ensure psql is in your PATH"
    exit 1
fi

echo "[1/4] Creating database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'esg_db'" | grep -q 1
if [ $? -ne 0 ]; then
    echo "Creating esg_db..."
    psql -U postgres -c "CREATE DATABASE esg_db;"
    if [ $? -eq 0 ]; then
        echo "✓ Database created successfully"
    else
        echo "ERROR: Failed to create database"
        exit 1
    fi
else
    echo "✓ Database already exists"
fi

echo ""
echo "[2/4] Running schema..."
psql -U postgres -d esg_db -f schema.sql
if [ $? -eq 0 ]; then
    echo "✓ Schema created successfully"
else
    echo "ERROR: Failed to create schema"
    exit 1
fi

echo ""
echo "[3/4] Installing dependencies..."
cd Backend
npm install
if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed"
else
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
cd ..

echo ""
echo "[4/4] Seeding database with users..."
cd Backend
node seed.js
if [ $? -eq 0 ]; then
    echo "✓ Database seeded successfully"
else
    echo "ERROR: Failed to seed database"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "========================================="
echo "✓ Setup Complete!"
echo "========================================="
echo ""
echo "Default Login Credentials:"
echo "  Admin: admin@test.com / admin123"
echo "  User: user@test.com / user123"
echo "  Supplier: supplier@test.com / supplier123"
echo ""
echo "Next steps:"
echo "  1. Open Terminal 1: cd Backend && npm start"
echo "  2. Open Terminal 2: cd frontend && npm start"
echo "  3. Open browser: http://localhost:5173"
echo ""
