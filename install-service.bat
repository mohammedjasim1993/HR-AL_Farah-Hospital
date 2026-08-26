@echo off
chcp 65001 > NUL
title تثبيت خدمة نظام مستشفى الفرح (التشغيل التلقائي الخفي)

:: الانتقال التلقائي لمجلد المشروع فوراً (حتى عند التشغيل كمسؤول Run as Administrator)
cd /d "%~dp0"

echo =========================================================
echo    جاري تهيئة وتثبيت خدمة النظام (التشغيل المخفي 100٪)...
echo =========================================================

:: 1. إيقاف وإغلاق جميع العمليات والخدمات القديمة فوراً لتفريغ المنافذ
echo [1/4] إيقاف جميع العمليات والخدمات السابقة...
taskkill /F /IM node.exe >NUL 2>&1
call pm2 delete all >NUL 2>&1
call pm2 kill >NUL 2>&1
schtasks /delete /tn "AlFarrahHospitalHR" /f >NUL 2>&1

:: 2. بناء المشروع لإنشاء نسخة الإنتاج المستقرة (dist/server.cjs)
echo [2/4] جاري بناء وتجهيز حزمة النظام (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [خطأ] فشلت عملية بناء المشروع! يرجى التحقق من وجود أي أخطاء برمجة.
    pause
    exit /b %errorlevel%
)

:: 3. مسارات مجلد المشروع ومجلد بدء التشغيل في الويندوز
set "PROJECT_DIR=%~dp0"
:: إزالة الشرطة المائلة الأخيرة إن وجدت
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_PATH=%STARTUP_FOLDER%\Start-AlFarrah-Silent.vbs"

:: تنظيف أي ملفات تشغيل قديمة من مجلد Startup
if exist "%VBS_PATH%" del /f /q "%VBS_PATH%"
if exist "%STARTUP_FOLDER%\Start-AlFarrah-Hidden.vbs" del /f /q "%STARTUP_FOLDER%\Start-AlFarrah-Hidden.vbs"

:: 4. إنشاء سكريبت VBS للتشغيل المباشر للخادم بدون CMD أو NPM (مخفي تماماً)
echo [3/4] إنشاء ملف التشغيل المخفي في مجلد Startup...
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS_PATH%"
echo Set processEnv = WshShell.Environment("PROCESS") >> "%VBS_PATH%"
echo processEnv("PORT") = "4000" >> "%VBS_PATH%"
echo processEnv("NODE_ENV") = "production" >> "%VBS_PATH%"
echo WshShell.CurrentDirectory = "%PROJECT_DIR%" >> "%VBS_PATH%"
echo WshShell.Run "cmd /c node dist\server.cjs", 0, False >> "%VBS_PATH%"

:: 5. تشغيل النظام فوراً في الخلفية
echo [4/4] تشغيل خادم النظام فوراً في الخلفية...
wscript.exe "%VBS_PATH%"

echo =========================================================
echo  تمت العملية بنجاح!
echo =========================================================
echo  1. تم بناء نسخة الإنتاج المستقرة (dist/server.cjs).
echo  2. تم تشغيل النظام فوراً في الخلفية (مخفي 100٪ بدون أي نافذة).
echo  3. سيعمل النظام تلقائياً وبشكل مخفي عند كل تشغيل للحاسبة.
echo.
echo  رابط النظام في المتصفح:
echo  http://localhost:4000
echo =========================================================
echo.
pause
