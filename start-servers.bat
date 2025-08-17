@echo off
echo 🚀 Starting Museoo servers...
echo.

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4 Address"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP: =%

echo 📱 To access on your phone, use these URLs:
echo    Frontend: http://%IP%:5173
echo    Backend:  http://%IP%:3000
echo.
echo ⚠️  Make sure your phone and computer are on the same WiFi network!
echo.

REM Start backend server in background
echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait a moment then start frontend
timeout /t 3 /nobreak >nul
echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd Museoo && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 📱 Open http://%IP%:5173 on your phone to test the QR scanner!
echo.
pause 