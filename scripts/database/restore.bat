@echo off
chcp 65001 >nul
echo ======================================
echo Vibely Database Restore Script
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Check arguments
if "%~1"=="" (
  echo Usage: %0 ^<backup_file.sql.gz^>
  echo Example: %0 .\backups\vibely_backup_20260827.sql.gz
  exit /b 1
)

set BACKUP_FILE=%~1

REM Check if backup file exists
if not exist "%BACKUP_FILE%" (
  echo ERROR: Backup file not found: %BACKUP_FILE%
  exit /b 1
)

REM Configuration
set COMPOSE_FILE=docker-compose.yml

REM Get database credentials
echo [1/5] Reading database configuration...
if exist ".env" (
  for /f "tokens=1,2 delims==" %%a in (.env) do (
    if "%%a"=="POSTGRES_USER" set DB_USER=%%b
    if "%%a"=="POSTGRES_DB" set DB_NAME=%%b
  )
) else (
  echo ERROR: .env file not found
  exit /b 1
)

set DB_USER=%DB_USER:vibely%
set DB_NAME=%DB_NAME:vibely%

echo Database: %DB_NAME%

REM Confirm restore
echo [2/5] Confirming restore...
echo WARNING: This will overwrite the current database!
echo Database: %DB_NAME%
echo Backup: %BACKUP_FILE%
set /p CONFIRM=Are you sure? (yes/no):

if /i not "%CONFIRM%"=="yes" (
  echo Restore cancelled
  exit /b 0
)

REM Stop backend service
echo [3/5] Stopping backend service...
docker compose -f %COMPOSE_FILE% stop backend

REM Restore database
echo [4/5] Restoring database...
powershell -Command "Get-Content '%BACKUP_FILE%' -Encoding UTF8 | docker compose -f '%COMPOSE_FILE%' exec -T postgres psql -U '%DB_USER%' '%DB_NAME%'"

REM Restart backend service
echo [5/5] Restarting backend service...
docker compose -f %COMPOSE_FILE% start backend

echo.
echo ======================================
echo Restore Complete!
echo ======================================
echo.
echo Verify the restore by checking:
echo   curl http://localhost:4000/api/health
echo.

pause
