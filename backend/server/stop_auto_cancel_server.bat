@echo off
echo Stopping Auto Cancel Server...
taskkill /f /im php.exe /fi "WINDOWTITLE eq auto_cancel_server.php*"
echo Auto Cancel Server stopped.
pause
