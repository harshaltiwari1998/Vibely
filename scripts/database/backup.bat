@echo off
chcp 65001 >nul
echo ======================================
echo Vibely Database Backup Script
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Configuration
set BACKUP_DIR=./backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=%BACKUP_DIR%\vibely_backup_%TIMESTAMP%.sql
set COMPOSE_FILE=docker-compose.yml

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Check if PostgreSQL container is running
echo [1/4] Checking PostgreSQL...
docker compose -f %COMPOSE_FILE% ps postgres | findstr "running" >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: PostgreSQL container is not running
  exit /b 1
)

echo PostgreSQL is running

REM Get database credentials
echo [2/4] Reading database configuration...
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

REM Create backup
echo [3/4] Creating backup...
docker compose -f %COMPOSE_FILE% exec -T postgres pg_dump -U %DB_USER% %DB_NAME% > "%BACKUP_FILE%"

REM Compress backup
echo [4/4] Compressing backup...
powershell -Command "Compress-Archive -Path '%BACKUP_FILE%' -DestinationPath '%BACKUP_FILE%.gz'"
del "%BACKUP_FILE%"

echo.
echo ======================================
echo Backup Complete!
echo ======================================
echo.
echo Backup file: %BACKUP_FILE%.gz
echo.
echo To restore:
echo   gunzip -c %BACKUP_FILE%.gz ^| docker compose -f %COMPOSE_FILE% exec -T postgres psql -U %DB_USER% %DB_NAME%
echo.

pause
