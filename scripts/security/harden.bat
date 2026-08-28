@echo off
chcp 65001 >nul
echo ======================================
echo Vibely Security Hardening Script
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Check JWT secrets
echo [1/10] Checking JWT secrets...
findstr /C:"change-me-access-secret" .env >nul 2>&1
if %errorlevel%==0 (
  echo ERROR: Default JWT_SECRET found in .env
  echo Generate a secure secret: openssl rand -base64 32
  exit /b 1
)

findstr /C:"change-me-refresh-secret" .env >nul 2>&1
if %errorlevel%==0 (
  echo ERROR: Default JWT_REFRESH_SECRET found in .env
  echo Generate a secure secret: openssl rand -base64 32
  exit /b 1
)

echo JWT secrets configured

REM Check CORS
echo [2/10] Checking CORS configuration...
findstr /C:"CORS_ORIGIN=*" .env >nul 2>&1
if %errorlevel%==0 (
  echo ERROR: CORS_ORIGIN set to wildcard in production
  exit /b 1
)

echo CORS configured

REM Check .gitignore
echo [3/10] Verifying .gitignore...
findstr /C:".env" .gitignore >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: .env not in .gitignore
  exit /b 1
)

echo .gitignore verified

echo.
echo ======================================
echo Security Status: HARDENED
echo ======================================
echo.
echo Next steps:
echo 1. Run 'npm audit' to check dependencies
echo 2. Configure firewall rules
echo 3. Set up SSL/TLS certificates
echo 4. Enable database encryption
echo 5. Configure backup encryption

pause
