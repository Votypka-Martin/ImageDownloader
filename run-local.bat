@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================================
echo   Cosmos Image Downloader - Webovy server
echo   Spoustim na http://localhost:3000
echo ========================================================
echo.
start http://localhost:3000
node dev-server.js
pause
