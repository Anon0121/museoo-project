@echo off
title Museoo Simple Server
color 0A

echo ========================================
echo    MUSEOO SIMPLE SERVER STARTUP
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start "Backend" cmd /k "title Backend Server && npm start"
cd ..

echo Starting Frontend Server...
cd Museoo
start "Frontend" cmd /k "title Frontend Server && npm run dev"
cd ..

echo.
echo ========================================
echo    SERVERS STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Local Access:
echo - Backend:  http://localhost:5000
echo - Frontend: http://localhost:5173
echo.
echo Network Access (from other devices on same WiFi):
echo - Frontend: http://192.168.1.8:5173
echo - Backend:  http://192.168.1.8:5000
echo.
echo ========================================
echo Your website is now running!
echo Anyone on your WiFi can access it.
echo.
echo Press any key to exit...
pause > nul
