@echo off
title Monza TECH PWA Server
echo.
echo ================================================
echo            Monza TECH PWA Server
echo ================================================
echo.
echo Starting your 5MB Monza TECH application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo 📥 Please install Node.js from: https://nodejs.org
    echo    Then run this script again.
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo 🚀 Starting PWA server...
echo.
echo 📱 Your app will open in the browser automatically
echo 🔧 Look for the "Install" button in the address bar
echo 💡 Once installed, it works offline like a desktop app
echo.
echo 🛑 To stop the server: Press Ctrl+C
echo.

node install-server.js

echo.
echo 👋 Monza TECH PWA Server stopped
echo.
pause
