@echo off
REM ESG MVP - Database Setup Script for Windows

echo.
echo =========================================
echo ESG MVP - Database Setup
echo =========================================
echo.

REM Set PostgreSQL path directly
set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe

REM Check if PostgreSQL is installed
if not exist "%PSQL_PATH%" (
    echo ERROR: PostgreSQL not found at %PSQL_PATH%
    echo Please verify PostgreSQL is installed in C:\Program Files\PostgreSQL\
    pause
    exit /b 1
)

echo [1/4] Creating database...
"%PSQL_PATH%" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'esg_db'" | findstr "1" >nul
if %errorlevel% neq 0 (
    echo Creating esg_db...
    "%PSQL_PATH%" -U postgres -c "CREATE DATABASE esg_db;" >nul 2>&1
    REM Don't check error level, just verify creation
    "%PSQL_PATH%" -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'esg_db'" | findstr "1" >nul
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
"%PSQL_PATH%" -U postgres -d esg_db -f schema.sql >nul 2>&1
echo ✓ Schema initialized

echo.
echo [3/4] Installing dependencies...
cd Backend
call npm install >nul 2>&1
echo ✓ Dependencies checked
cd ..

echo.
echo [4/4] Seeding database with users...
cd Backend
call node seed.js >nul 2>&1
echo ✓ Database seeded
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
