@echo off
echo ========================================
echo Auto-Setup: Auto Cancel Expired Reschedules
echo ========================================
echo.
echo This script will automatically create a Windows Task Scheduler task
echo to run the auto-cancel function every 1 minute (TESTING MODE).
echo.

REM Get the current directory (where the script is located)
set "SCRIPT_DIR=%~dp0"
set "PHP_SCRIPT=%SCRIPT_DIR%auto_cancel_cron.php"

echo Script Directory: %SCRIPT_DIR%
echo PHP Script Path: %PHP_SCRIPT%
echo.

REM Check if PHP exists
if not exist "C:\xampp\php\php.exe" (
    echo ERROR: PHP not found at C:\xampp\php\php.exe
    echo Please install XAMPP or update the PHP path in this script.
    pause
    exit /b 1
)

REM Check if the PHP script exists
if not exist "%PHP_SCRIPT%" (
    echo ERROR: auto_cancel_cron.php not found at %PHP_SCRIPT%
    echo Please ensure the script is in the same directory as this batch file.
    pause
    exit /b 1
)

echo Creating Windows Task Scheduler task...
echo.

REM Delete existing task if it exists (ignore errors)
schtasks /delete /tn "Auto Cancel Expired Reschedules" /f >nul 2>&1

REM Create the scheduled task - EVERY 1 MINUTE FOR TESTING
schtasks /create ^
    /tn "Auto Cancel Expired Reschedules" ^
    /tr "\"C:\xampp\php\php.exe\" \"%PHP_SCRIPT%\"" ^
    /sc minute ^
    /mo 1 ^
    /ru "SYSTEM" ^
    /rl highest ^
    /f

if %errorlevel% equ 0 (
    echo.
    echo ✓ SUCCESS: Task created successfully!
    echo.
    echo Task Details:
    echo - Name: Auto Cancel Expired Reschedules
    echo - Runs every: 1 MINUTE (TESTING MODE)
    echo - Command: C:\xampp\php\php.exe "%PHP_SCRIPT%"
    echo - User: SYSTEM
    echo - Priority: Highest
    echo.
    echo ⚠️  WARNING: This is set to run every 1 minute for testing!
    echo    Change to 5 minutes for production use.
    echo.
    echo The task is now active and will run automatically.
    echo.
    echo To verify the task was created, run:
    echo schtasks /query /tn "Auto Cancel Expired Reschedules"
    echo.
    echo To view task logs, check: %SCRIPT_DIR%auto_cancel_cron.log
    echo.
) else (
    echo.
    echo ✗ ERROR: Failed to create the scheduled task.
    echo This might be due to insufficient permissions.
    echo Please run this script as Administrator.
    echo.
)

echo Testing the auto-cancel function now...
echo.
"C:\xampp\php\php.exe" "%PHP_SCRIPT%"
echo.
echo Check the auto_cancel_cron.log file for detailed results.
echo.
echo ⚠️  REMEMBER: Change interval to 5 minutes for production!
echo.
pause
