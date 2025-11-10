@echo off
echo ========================================
echo CodeVault Emergency Fix Script
echo ========================================
echo.

echo [1/5] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Deleting Vite cache...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo     - Deleted node_modules\.vite
) else (
    echo     - node_modules\.vite not found
)

if exist dist (
    rmdir /s /q dist
    echo     - Deleted dist
) else (
    echo     - dist not found
)

if exist client\node_modules\.vite (
    rmdir /s /q client\node_modules\.vite
    echo     - Deleted client\node_modules\.vite
) else (
    echo     - client\node_modules\.vite not found
)

echo [3/5] Reinstalling dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo [4/5] Starting dev server...
start cmd /k "npm run dev"

echo [5/5] Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Fix complete! 
echo.
echo Next steps:
echo 1. Wait for dev server to fully start
echo 2. Open browser to http://localhost:5173
echo 3. Press Ctrl+Shift+R to hard reload
echo 4. Check console for errors
echo ========================================
echo.
pause
