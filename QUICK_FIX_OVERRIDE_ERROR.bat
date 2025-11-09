@echo off
echo ========================================
echo FIXING NPM OVERRIDE ERROR
echo ========================================
echo.
echo This error happens when package-lock.json
echo has cached overrides but package.json doesn't.
echo.
echo Solution: Delete lock file and reinstall
echo.

echo Step 1: Deleting package-lock.json...
if exist package-lock.json del package-lock.json

echo Step 2: Clearing npm cache...
call npm cache clean --force

echo Step 3: Installing dependencies...
call npm install

echo.
echo ========================================
echo DONE!
echo ========================================
echo.
echo Now run: npm run dev
pause
