@echo off
chcp 65001 >nul 2>&1
REM Health Buddy desktop pet launcher (Windows)

cd /d "%~dp0"

echo.
echo   Health Buddy Desktop Pet Launcher
echo   ---------------------------------
echo.

if "%~1"=="--help" goto :show_help
if "%~1"=="-h"     goto :show_help

REM Prefer portable Node.js bundled by setup
set "PORTABLE_NODE=%LOCALAPPDATA%\health-buddy-node\node-v22.16.0-win-x64"
if exist "%PORTABLE_NODE%\node.exe" (
    set "PATH=%PORTABLE_NODE%;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)
echo [OK]    Node.js:
node -v

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found.
    pause
    exit /b 1
)
echo [OK]    npm:
npm -v

if not exist "node_modules" (
    echo.
    echo [INFO]  Installing dependencies...
    call npm install --legacy-peer-deps --ignore-scripts
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

if not exist "node_modules\electron\dist\electron.exe" (
    echo [INFO]  Downloading Electron...
    call node node_modules/electron/install.js
    if errorlevel 1 (
        echo [ERROR] Electron download failed.
        pause
        exit /b 1
    )
)

set "ELECTRON=%~dp0node_modules\electron\dist\electron.exe"
set "MAIN=%~dp0legacy\electron-prototype\main.js"

if not exist "%ELECTRON%" (
    echo [ERROR] Electron not found: %ELECTRON%
    pause
    exit /b 1
)

if not exist "%MAIN%" (
    echo [ERROR] Main script not found: %MAIN%
    pause
    exit /b 1
)

echo [OK]    Dependencies ready.
echo.

if "%~1"=="--web" (
    echo [INFO]  Starting Web MVP at http://localhost:5173
    call npm run dev:web
    goto :done
)

set "EXTRA_ARGS="
if "%~1"=="--pet-only" set "EXTRA_ARGS=--pet-only"
if "%~1"=="--dev"      set "EXTRA_ARGS=--dev"

if "%~1"=="--pet-only" (
    echo [INFO]  Starting pet window only. Ctrl+Shift+T opens treehouse.
) else if "%~1"=="--dev" (
    echo [INFO]  Starting dev mode with DevTools...
) else (
    echo [INFO]  Starting desktop pet + treehouse. Ctrl+Shift+T toggles treehouse.
)
echo.

"%ELECTRON%" "%MAIN%" %EXTRA_ARGS%
if errorlevel 1 (
    echo.
    echo [ERROR] Electron exited with error. See message above.
    pause
    exit /b 1
)
goto :done

:show_help
echo.
echo   Usage: start.bat [option]
echo     (none)       Full mode: pet + treehouse
echo     --pet-only   Pet floating window only
echo     --dev        Dev mode with DevTools
echo     --web        Web MVP in browser
echo.
goto :done

:done
exit /b 0
