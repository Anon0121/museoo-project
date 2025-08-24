@echo off
echo ========================================
echo   Remove Method Column Migration
echo ========================================
echo.
echo This script will remove the 'method' column from the donation_details table
echo since we now only accept cash payments with proof of payment images.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo 🔧 Running migration script...
cd backend
node scripts/remove_method_column.js

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo The method column has been removed from the donation_details table.
echo All monetary donations will now be recorded as cash payments with proof.
echo.
pause
