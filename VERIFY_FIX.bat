@echo off
echo ========================================
echo Verifying React Installation
echo ========================================
echo.

echo Checking React version...
powershell -Command "if (Test-Path node_modules\react\package.json) { Write-Host 'React version:' -NoNewline; Write-Host ' ' -NoNewline; (Get-Content node_modules\react\package.json | ConvertFrom-Json).version } else { Write-Host 'React not found - Please run npm install' }"

echo.
echo Checking for duplicate React installations...
powershell -Command "$count = (Get-ChildItem -Path node_modules -Recurse -Directory -Filter 'react' -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq 'react' -and $_.FullName -match 'node_modules\\react$' } | Measure-Object).Count; if ($count -eq 1) { Write-Host 'Good! Only 1 React instance found' -ForegroundColor Green } else { Write-Host 'Warning: Multiple React instances found:' $count -ForegroundColor Yellow }"

echo.
echo Checking React-DOM version...
powershell -Command "if (Test-Path node_modules\react-dom\package.json) { Write-Host 'React-DOM version:' -NoNewline; Write-Host ' ' -NoNewline; (Get-Content node_modules\react-dom\package.json | ConvertFrom-Json).version } else { Write-Host 'React-DOM not found - Please run npm install' }"

echo.
echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo If everything looks good, start your dev server with:
echo npm run dev
echo.
pause
