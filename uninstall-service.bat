@echo off
chcp 65001 > NUL
title إيقاف وإلغاء خدمة نظام مستشفى الفرح

:: الانتقال التلقائي لمجلد المشروع فوراً (حتى عند التشغيل كمسؤول Run as Administrator)
cd /d "%~dp0"

echo =========================================================
echo    جاري إلغاء الخدمة وإيقاف النظام...
echo =========================================================

:: 1. إيقاف عمليات node و pm2
taskkill /F /IM node.exe >NUL 2>&1
call pm2 delete all >NUL 2>&1
call pm2 kill >NUL 2>&1
schtasks /delete /tn "AlFarrahHospitalHR" /f >NUL 2>&1

:: 2. إزالة ملفات التشغيل التلقائي من مجلد Startup
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
if exist "%STARTUP_FOLDER%\Start-AlFarrah-Silent.vbs" del /f /q "%STARTUP_FOLDER%\Start-AlFarrah-Silent.vbs"
if exist "%STARTUP_FOLDER%\Start-AlFarrah-Hidden.vbs" del /f /q "%STARTUP_FOLDER%\Start-AlFarrah-Hidden.vbs"

echo =========================================================
echo  تم إيقاف النظام وحذف ملفات التفعيل التلقائي بنجاح.
echo =========================================================
echo.
pause
