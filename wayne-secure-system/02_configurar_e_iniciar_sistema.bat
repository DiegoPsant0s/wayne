@echo off
setlocal
color 0A

echo === CONFIGURANDO E INICIANDO O SISTEMA ===

:: --- VERIFICAR INSTALACAO ---
echo [1/3] Verificando instalacoes...
where python >nul 2>nul || (echo ERRO: Python nao encontrado no PATH! & pause & exit /b)
where node >nul 2>nul || (echo ERRO: Node.js nao encontrado no PATH! & pause & exit /b)
where npm >nul 2>nul || (echo ERRO: NPM nao encontrado no PATH! & pause & exit /b)

:: --- INSTALAR DEPENDÊNCIAS E INICIAR BACKEND ---
echo [2/3] Instalando dependencias do backend...
cd /d "%~dp0"
if not exist "venv" (
    echo Criando ambiente virtual Python...
    python -m venv venv || (echo ERRO ao criar venv! & pause & exit /b)
)
call "%~dp0\venv\Scripts\activate.bat"
echo Instalando dependências do backend...
python -m pip install --upgrade pip || (echo ERRO ao atualizar pip! & pause & exit /b)
pip install -r requirements.txt || (echo ERRO ao instalar requirements! & pause & exit /b)

echo Iniciando backend...
start "Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn main:app --reload"

:: --- INSTALAR DEPENDÊNCIAS E INICIAR FRONTEND ---
echo [3/3] Instalando dependencias do frontend...
cd wayne-frontend
call npm install || (echo ERRO ao instalar dependencias do frontend! & pause & exit /b)

echo Iniciando frontend...
start "Frontend" cmd /k "npm run dev"
cd ..

:: --- ABRIR NO NAVEGADOR ---
timeout /t 10 >nul
start http://localhost:5173

echo === TUDO PRONTO! APLICACAO INICIADA ===
pause
