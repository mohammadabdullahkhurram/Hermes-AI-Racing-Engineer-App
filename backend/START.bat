@echo off
title AI Race Engineer — Setup & Start
echo ================================================
echo   AI Race Engineer — Windows PC Setup
echo ================================================
echo.

REM Check Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Download from https://www.python.org/downloads/
    pause
    exit /b
)

REM Install dependencies
echo Installing Python dependencies...
python -m pip install --no-cache-dir -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b
)
echo Dependencies installed OK.
echo.

REM Create output directories
if not exist "output" mkdir output
if not exist "output\laps" mkdir output\laps

REM Start server in a new window
echo Starting Flask server on port 8080...
start "AI Race Engineer — Server" cmd /k "python server.py"

REM Wait a moment for the server to start
timeout /t 3 /nobreak >nul

REM Start recorder
echo Starting AC Recorder...
echo.
echo ================================================
echo   INSTRUCTIONS:
echo   1. Make sure Assetto Corsa is running
echo   2. Load Yas Marina North track
echo   3. The recorder will connect automatically
echo   4. Open your deployed frontend URL
echo   5. Click the gear icon on Live Mode page
echo   6. Set Backend URL to http://localhost:8080
echo      (or your ngrok URL if accessing remotely)
echo ================================================
echo.
python src/ac_recorder.py
pause
