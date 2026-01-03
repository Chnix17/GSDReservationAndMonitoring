@echo off
REM Auto-approve department cron job runner for Windows
REM This script executes the auto-approve department PHP script

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Execute the PHP script
php "%SCRIPT_DIR%auto_approve_department_cron.php"
