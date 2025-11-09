@echo off
echo Fixing duplicate React instances...

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul

echo Step 2: Deleting node_modules and cache...
rmdir /s /q node_modules 2>nul
rmdir /s /q client\node_modules 2>nul
rmdir /s /q node_modules\.vite 2>nul
rmdir /s /q dist 2>nul
del package-lock.json 2>nul
del client\package-lock.json 2>nul

echo Step 3: Reinstalling dependencies...
call npm install

echo Step 4: Starting server...
npm run dev
