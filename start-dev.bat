@echo off
REM ==============================================================================
REM JURLAY AGENT - Windows Launcher & Process Manager
REM Owner: Nyons (CEO)
REM ==============================================================================

echo.
echo   ==============================================================================
echo   JURLAY AGENT - Autonomous Virtual AI Software House
echo   CEO: Nyons ^| Version: 1.0.0 (Windows Edition)
echo   ==============================================================================
echo.

set DIR=%~dp0
cd /d "%DIR%"

echo [1/3] Memeriksa MySQL Database (Port 3306)...
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [WARNING] MySQL port 3306 tidak terdeteksi aktif!
    echo Pastikan XAMPP / Laragon / MySQL Service sudah running.
) else (
    echo [OK] MySQL port 3306 terdeteksi aktif.
)

echo.
echo [2/3] Menjalankan Backend Server (Port 5001)...
start "JURLAY AGENT - Backend" cmd /k "cd /d "%DIR%backend" && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Menjalankan Frontend Web UI (Port 5173)...
start "JURLAY AGENT - Frontend" cmd /k "cd /d "%DIR%frontend" && npm run dev"

echo.
echo ==============================================================================
echo [SUCCESS] JURLAY AGENT Berhasil Dijalankan!
echo - Web Dashboard:  http://localhost:5173
echo - Backend API:    http://localhost:5001/api
echo - Health Check:   http://localhost:5001/health
echo ==============================================================================
echo.
pause
