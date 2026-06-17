@echo off
cd /d "%~dp0"
echo Installing dependencies if needed...
call npm install --silent
echo Starting BGA Free Games server...
node server.js
pause
