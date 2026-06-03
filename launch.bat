@echo off
chcp 65001 >nul 2>&1
title Health Buddy - Launcher
cd /d "%~dp0"

REM Ensure Node.js is on PATH (common install location)
set "PATH=%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs;%APPDATA%\npm;%PATH%"

echo.
echo   ========================================
echo        Health Buddy  -  Launcher
echo   ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Node.js not found. Run setup.bat first.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo   [ERROR] node_modules missing. Run setup.bat first.
  echo.
  pause
  exit /b 1
)

if not exist "assetstore\materials\treehouse\treehouse.png" (
  echo   [ERROR] Missing assetstore\materials\treehouse\treehouse.png
  echo.
  pause
  exit /b 1
)

echo   [OK] Starting Health Buddy...
echo   Close this window to quit the pet.
echo.

call npm run dev
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo   [ERROR] Failed to start ^(exit code %EXIT_CODE%^)
  echo.
  pause
)

exit /b %EXIT_CODE%
