@echo off
:: Ensure we are in the script's directory
cd /d "%~dp0"

:: Check for ADMIN privileges using net session and auto-elevate robustly
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ======================================================================
    echo   WARNING: This setup script requires Administrator privileges!
    echo ======================================================================
    echo.
    echo   Attempting to auto-elevate permissions...
    echo.
    
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~dpnx0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs" 2>nul
    del "%temp%\getadmin.vbs" 2>nul
    
    echo   If the Administrator prompt appeared, please accept it.
    echo   Otherwise, right-click this file and choose "Run as Administrator".
    echo.
    pause
    exit /b
)

:: Ensure we are in the script's directory after elevation
cd /d "%~dp0"

title ZKTeco 9500 Environment Setup & Verification

echo ======================================================================
echo   [SYSTEM CHECK] ZKTeco 9500 Biometric Agent Environment Setup
echo ======================================================================
echo.

:: 1. Check .NET Framework
echo [CHECK 1/3] Checking .NET Framework v4...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full" /v Release >nul 2>&1
if %errorLevel% equ 0 (
    echo     -[OK] .NET Framework v4+ is installed and ready.
) else (
    echo     -[WARN] .NET Framework v4+ not found! You may need to install it manually.
)
echo.

:: 2. Setup Firewall Rule
echo [CHECK 2/3] Configuring Windows Firewall Port 22001...
netsh advfirewall firewall show rule name="ZKTeco_Biometric_Port" >nul 2>&1
if %errorLevel% neq 0 (
    netsh advfirewall firewall add rule name="ZKTeco_Biometric_Port" dir=in action=allow protocol=TCP localport=22001 description="ZK9500 Biometric Agent WebSocket Port" >nul
    echo     -[OK] Firewall rule for Port 22001 added successfully.
) else (
    echo     -[OK] Firewall rule already exists for Port 22001.
)
echo.

:: 3. Check C++ Redistributable
echo [CHECK 3/3] Checking VC++ Redistributable...
reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes" >nul 2>&1
if %errorLevel% equ 0 (
    echo     -[OK] VC++ Redistributable (2015-2022) is installed.
) else (
    echo     -[WARN] VC++ Redistributable (2015-2022) not detected! 
    echo            If the biometric reader fails to initialize, please install
    echo            Microsoft Visual C++ Redistributable 2015-2022 x64.
)
echo.

echo ======================================================================
echo   Setup completed successfully! You can now close this window safely.
echo ======================================================================
echo.
pause
exit /b 0


