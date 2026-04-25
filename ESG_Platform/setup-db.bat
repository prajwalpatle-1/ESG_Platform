@echo off
REM ESG MVP - Database Setup Script for Windows

echo.
echo =========================================
echo ESG MVP - Database Setup
echo =========================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and add it to your PATH
    pause
    exit /b 1
)

echo [1/4] Creating database...
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'esg_db'" | findstr "1" >nul
if %errorlevel% neq 0 (
    echo Creating esg_db...
    psql -U postgres -c "CREATE DATABASE esg_db;"
    if %errorlevel% equ 0 (
        echo ✓ Database created successfully
    ) else (
        echo ERROR: Failed to create database
        pause
        exit /b 1
    )
) else (
    echo ✓ Database already exists
)

echo.
echo [2/4] Running schema...
psql -U postgres -d esg_db -f schema.sql
if %errorlevel% equ 0 (
    echo ✓ Schema created successfully
) else (
    echo ERROR: Failed to create schema
    pause
    exit /b 1
)

echo.
echo [3/4] Installing dependencies...
cd Backend
call npm install
if %errorlevel% equ 0 (
    echo ✓ Dependencies installed
) else (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] Seeding database with users...
cd Backend
call node seed.js
if %errorlevel% equ 0 (
    echo ✓ Database seeded successfully
) else (
    echo ERROR: Failed to seed database
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo =========================================
echo ✓ Setup Complete!
echo =========================================
echo.
echo Default Login Credentials:
echo   Admin: admin@test.com / admin123
echo   User: user@test.com / user123
echo   Supplier: supplier@test.com / supplier123
echo.
echo Next steps:
echo   1. Open Terminal 1: cd Backend && npm start
echo   2. Open Terminal 2: cd frontend && npm start
echo   3. Open browser: http://localhost:5173
echo.
pause
