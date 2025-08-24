@echo off
echo ========================================
echo   Remove Document Type Migration
echo ========================================
echo.
echo This script will remove the 'document' type from the donations table
echo and update any existing document donations to artifact type.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo 🔧 Running migration script...
cd backend
node scripts/remove_document_type.js

echo.
echo ========================================
echo   Migration Complete!
echo ========================================
echo.
echo The document type has been removed from the donations table.
echo Any existing document donations have been converted to artifact type.
echo.
pause
