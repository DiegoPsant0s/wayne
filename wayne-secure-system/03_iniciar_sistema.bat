@echo off
setlocal
color 0A

echo === INICIANDO O SISTEMA ===

:: --- ATIVAR BACKEND ---
cd /d "%~dp0"
call "%~dp0\venv\Scripts\activate.bat"
echo Iniciando backend...
start "Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn main:app --reload"

:: --- INICIAR FRONTEND ---
cd wayne-frontend
echo Iniciando frontend...
start "Frontend" cmd /k "npm run dev"
cd ..

:: --- ABRIR NO NAVEGADOR ---
timeout /t 10 >nul
start http://localhost:5173

echo === SISTEMA INICIADO! ===
pause
