@echo off
echo Starting Museoo Server...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"
cd ..

echo Starting Frontend Server...
cd Museoo
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo Waiting 10 seconds for servers to start...
timeout /t 10 /nobreak > nul

echo Starting ngrok tunnels...
echo.
echo Backend tunnel (Port 5000):
start "Backend Tunnel" cmd /k "ngrok http 5000"

echo Frontend tunnel (Port 5173):
start "Frontend Tunnel" cmd /k "ngrok http 5173"

echo.
echo ========================================
echo Museoo Server is starting up!
echo ========================================
echo.
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:5173
echo.
echo ngrok tunnels will provide public URLs
echo Check the ngrok windows for the public URLs
echo.
echo Press any key to exit this window...
pause > nul
