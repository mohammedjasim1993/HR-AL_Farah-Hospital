@echo off
:: Ensure we are in the script's directory
cd /d "%~dp0"

title ZKTeco x64 Installer Preparation & Auto Build

echo ==========================================================
echo   [PREPARATION] ZKTeco Fingerprint Agent - Installer Build
echo ==========================================================
echo.

:: 1. Check for Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed on this machine!
    echo Please download and install Node.js [Version 18 or newer] from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Run npm install
echo [STEP 1/3] Installing Node.js packages (npm install)...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed! Please check your internet connection.
    pause
    exit /b 1
)
echo [OK] npm install completed successfully.
echo.

:: 3. Create ZKTecoLocalAgent.vbs
echo [STEP 2/3] Creating Silent Background Runner (ZKTecoLocalAgent.vbs)...
echo Set WshShell = CreateObject^("WScript.Shell"^) > ZKTecoLocalAgent.vbs
echo WshShell.Run """node.exe"" ""server.js""", 0, False >> ZKTecoLocalAgent.vbs
echo [OK] ZKTecoLocalAgent.vbs created successfully.
echo.

:: 4. Download Portable node.exe and ZKTeco SDK components using curl
echo [STEP 3/3] Downloading Portable Node.exe and ZKTeco SDK Libraries...
if not exist "drivers" mkdir drivers

:: Check and download portable node.exe
if not exist "node.exe" (
    echo   -> Downloading portable node.exe [64-bit]...
    curl -L -o node.exe "https://nodejs.org/dist/v18.16.0/win-x64/node.exe"
) else (
    echo    -[OK] node.exe already downloaded.
)

:: Check and download libzkfp.dll
if not exist "libzkfp.dll" (
    echo   -> Downloading libzkfp.dll SDK...
    curl -L -o libzkfp.dll "https://github.com/S-Sajid-Ali/ZKTeco-Fingerprint-SDK/raw/master/driver/libzkfp.dll"
) else (
    echo    -[OK] libzkfp.dll already downloaded.
)

:: Check and download zkfpkeep.dll
if not exist "zkfpkeep.dll" (
    echo   -> Downloading zkfpkeep.dll SDK...
    curl -L -o zkfpkeep.dll "https://github.com/S-Sajid-Ali/ZKTeco-Fingerprint-SDK/raw/master/driver/zkfpkeep.dll"
) else (
    echo    -[OK] zkfpkeep.dll already downloaded.
)

:: Check and download ZK9500_Driver_x64.exe
if not exist "drivers\ZK9500_Driver_x64.exe" (
    echo   -> Downloading ZK9500_Driver_x64.exe...
    curl -L -o drivers\ZK9500_Driver_x64.exe "https://github.com/S-Sajid-Ali/ZKTeco-Fingerprint-SDK/raw/master/driver/ZK9500_Driver_x64.exe"
) else (
    echo    -[OK] ZK9500_Driver_x64.exe already downloaded.
)

:: Verify all downloads exist
set "DOWNLOAD_OK=1"
if not exist "node.exe" set "DOWNLOAD_OK=0"
if not exist "libzkfp.dll" set "DOWNLOAD_OK=0"
if not exist "zkfpkeep.dll" set "DOWNLOAD_OK=0"
if not exist "drivers\ZK9500_Driver_x64.exe" set "DOWNLOAD_OK=0"

echo.
if "%DOWNLOAD_OK%"=="1" (
    echo ======================================================================
    echo   SUCCESS: All files have been prepared and downloaded successfully!
    echo ======================================================================
    echo.
    echo   Prepared files in this directory for Inno Setup:
    echo     1. node.exe [Official portable Node.js runtime]
    echo     2. ZKTecoLocalAgent.vbs [Silent background runner script]
    echo     3. server.js + package.json + node_modules [Agent source and dependencies]
    echo     4. libzkfp.dll + zkfpkeep.dll [ZKTeco core SDK libraries]
    echo     5. drivers\ZK9500_Driver_x64.exe [Silent fingerprint hardware driver]
    echo.
    echo   NEXT STEP:
    echo     Open "ZKTeco_9500_Installer_Creator.iss" in Inno Setup and press F9
    echo     to compile your unified offline installer!
) else (
    echo ======================================================================
    echo   WARNING: Some downloads failed!
    echo ======================================================================
    echo   Please manually download and place them in this folder:
    echo   - node.exe [from: https://nodejs.org/dist/v18.16.0/win-x64/node.exe]
    echo   - libzkfp.dll [from ZKTeco Fingerprint SDK]
    echo   - zkfpkeep.dll [from ZKTeco Fingerprint SDK]
    echo   - drivers\ZK9500_Driver_x64.exe [from ZKTeco Fingerprint SDK]
)
echo.
pause