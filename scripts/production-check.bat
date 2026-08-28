@echo off
chcp 65001 >nul
echo ======================================
echo Vibely Production Readiness Check
echo ======================================
echo.

set ERRORS=0
set WARNINGS=0

REM Check command exists
:check_command
echo   Checking %1...
%1 --version >nul 2>&1
if %errorlevel%==0 (
  echo     [OK] %1 installed
) else (
  echo     [FAIL] %1 not found
  set /a ERRORS+=1
)
goto :eof

REM Check file exists
:check_file
echo   Checking %1...
if exist "%1" (
  echo     [OK] %1 exists
) else (
  echo     [FAIL] %1 missing
  set /a ERRORS+=1
)
goto :eof

echo 1. Checking Prerequisites...
call :check_command node
call :check_command npm
call :check_command docker
call :check_command "docker compose"
echo.

echo 2. Checking Project Structure...
call :check_file package.json
call :check_file docker-compose.yml
call :check_file .env.example
call :check_file .gitignore
call :check_file README.md
echo.

echo 3. Checking Documentation...
call :check_file README.md
call :check_file docs\DEPLOYMENT.md
call :check_file docs\SECURITY.md
call :check_file docs\WEBRTC.md
call :check_file docs\MONITORING.md
call :check_file docs\RUNBOOK.md
echo.

echo 4. Checking Scripts...
call :check_file scripts\security\harden.bat
call :check_file scripts\deployment\deploy.bat
call :check_file scripts\database\backup.bat
call :check_file scripts\monitoring\setup-monitoring.bat
echo.

echo 5. Checking Docker Configuration...
call :check_file docker\backend.Dockerfile
call :check_file docker\web.Dockerfile
call :check_file docker\nginx.conf
call :check_file docker-compose.monitoring.yml
echo.

echo 6. Checking CI/CD...
call :check_file .github\workflows\ci-cd.yml
echo.

echo ======================================
echo Summary
echo ======================================
echo.
echo Errors:   %ERRORS%
echo Warnings: %WARNINGS%
echo.

if %ERRORS%==0 (
  echo [OK] READY FOR PRODUCTION
  echo.
  echo Next steps:
  echo 1. Review warnings
  echo 2. Run security hardening: scripts\security\harden.bat
  echo 3. Deploy: scripts\deployment\deploy.bat
  echo 4. Set up monitoring: scripts\monitoring\setup-monitoring.bat
  pause
  exit /b 0
) else (
  echo [FAIL] NOT READY - Fix errors before deployment
  pause
  exit /b 1
)
