@echo off
echo ========================================
echo NUCLEAR OPTION - Complete Clean Reset
echo ========================================

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Deleting ALL build artifacts and caches...
rmdir /s /q node_modules 2>nul
rmdir /s /q .vite 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q build 2>nul
del package-lock.json 2>nul

echo Step 3: Clearing npm cache...
call npm cache clean --force

echo Step 4: Fresh install...
call npm install

echo Step 5: Clearing browser storage...
echo IMPORTANT: After server starts, do this in browser:
echo 1. Press F12 (open DevTools)
echo 2. Go to Application tab
echo 3. Click "Clear site data"
echo 4. Hard refresh: Ctrl+Shift+R

echo Step 6: Starting server...
npm run dev

pause
