@echo off
chcp 65001 >nul
echo ======================================
echo Vibely Production Deployment Script
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Check prerequisites
echo [1/8] Checking prerequisites...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Docker is required
  exit /b 1
)

docker compose version >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Docker Compose is required
  exit /b 1
)

echo Prerequisites OK

REM Check environment file
echo [2/8] Checking environment configuration...
if not exist ".env" (
  echo ERROR: .env not found
  echo Copy .env.example to .env and configure it
  exit /b 1
)

echo Environment file found

REM Build Docker images
echo [3/8] Building Docker images...
docker compose -f docker-compose.yml build --no-cache

echo Docker images built

REM Start services
echo [4/8] Starting services...
docker compose -f docker-compose.yml up -d

echo Services started

REM Wait for services
echo [5/8] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check backend health
curl -sf http://localhost:4000/api/health >nul 2>&1
if %errorlevel%==0 (
  echo Backend is healthy
) else (
  echo WARNING: Backend health check failed
)

echo.
echo ======================================
echo Deployment Complete!
echo ======================================
echo.
echo Services:
echo   - Web:        http://localhost (port 80)
echo   - Backend:    http://localhost:4000
echo   - Health:     http://localhost:4000/api/health
echo.
echo Next steps:
echo 1. Configure SSL/TLS certificates
echo 2. Set up monitoring: docker compose -f docker-compose.monitoring.yml up -d
echo 3. Configure firewall rules
echo 4. Test the application
echo.

pause
