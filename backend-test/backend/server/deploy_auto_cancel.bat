@echo off
REM ========================================
REM Deployment Script: Auto Cancel Setup
REM ========================================
REM This script is designed to be run during backend deployment
REM It will silently set up the auto-cancel task without user interaction
REM TESTING MODE: Runs every 1 minute

echo [DEPLOY] Setting up Auto Cancel Expired Reschedules (1 minute interval for testing)...

REM Get current directory
set "SCRIPT_DIR=%~dp0"
set "PHP_SCRIPT=%SCRIPT_DIR%auto_cancel_cron.php"

echo [DEBUG] Script Directory: %SCRIPT_DIR%
echo [DEBUG] PHP Script Path: %PHP_SCRIPT%

REM Silent checks (no output unless error)
if not exist "C:\xampp\php\php.exe" (
    echo [ERROR] PHP not found at C:\xampp\php\php.exe
    exit /b 1
)

if not exist "%PHP_SCRIPT%" (
    echo [ERROR] auto_cancel_cron.php not found at %PHP_SCRIPT%
    exit /b 1
)

echo [INFO] Files verified successfully

REM Delete existing task silently
schtasks /delete /tn "Auto Cancel Expired Reschedules" /f >nul 2>&1

REM Create the scheduled task silently - EVERY 1 MINUTE FOR TESTING
echo [INFO] Creating scheduled task...
schtasks /create ^
    /tn "Auto Cancel Expired Reschedules" ^
    /tr "\"C:\xampp\php\php.exe\" \"%PHP_SCRIPT%\"" ^
    /sc minute ^
    /mo 1 ^
    /ru "SYSTEM" ^
    /rl highest ^
    /f

if %errorlevel% equ 0 (
    echo [SUCCESS] Auto-cancel task created - runs every 1 MINUTE (testing mode)
) else (
    echo [ERROR] Failed to create scheduled task - exit code %errorlevel%
    exit /b 1
)

REM Test the function once
echo [TEST] Running initial auto-cancel check...
"C:\xampp\php\php.exe" "%PHP_SCRIPT%"

if %errorlevel% equ 0 (
    echo [SUCCESS] Auto-cancel function test completed
) else (
    echo [WARNING] Auto-cancel test failed - check logs
)

echo [DEPLOY] Auto-cancel setup completed successfully
echo [INFO] Task runs every 1 minute for testing purposes
echo [INFO] Log file: %SCRIPT_DIR%auto_cancel_cron.log
exit /b 0
