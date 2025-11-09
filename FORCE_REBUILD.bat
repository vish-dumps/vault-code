@echo off
echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul

echo Clearing Vite cache...
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q client\node_modules\.vite 2>nul
rmdir /s /q dist 2>nul

echo Starting fresh server...
npm run dev
