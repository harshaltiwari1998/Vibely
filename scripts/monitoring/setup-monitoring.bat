@echo off
chcp 65001 >nul
echo ======================================
echo Vibely Monitoring Setup Script
echo ======================================
echo.

setlocal enabledelayedexpansion

REM Check prerequisites
echo [1/4] Checking prerequisites...
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

REM Start monitoring services
echo [2/4] Starting monitoring services...
docker compose -f docker-compose.monitoring.yml up -d

echo Monitoring services started

REM Wait for services
echo [3/4] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check services
echo [4/4] Checking services...
curl -sf http://localhost:9090/-/healthy >nul 2>&1
if %errorlevel%==0 (
  echo Prometheus is running
) else (
  echo WARNING: Prometheus not responding
)

curl -sf http://localhost:3000/api/health >nul 2>&1
if %errorlevel%==0 (
  echo Grafana is running
) else (
  echo WARNING: Grafana not responding
)

echo.
echo ======================================
echo Monitoring Setup Complete!
echo ======================================
echo.
echo Services:
echo   - Prometheus: http://localhost:9090
echo   - Grafana:    http://localhost:3000 ^(admin / admin^)
echo.
echo Next steps:
echo 1. Access Grafana and configure data sources
echo 2. Import dashboard from monitoring/grafana/dashboards/vibely-dashboard.json
echo 3. Configure alerts
echo 4. Update notification channels
echo.

pause
