# PowerShell skript pro lokální spuštění webového serveru
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Cosmos Image Downloader - Webový server" -ForegroundColor Cyan
Write-Host "  Otevírám prohlížeč na http://localhost:3000 ..." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Start-Process "http://localhost:3000"
node dev-server.js
