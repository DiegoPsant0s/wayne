@echo off
setlocal
color 0A

echo === INSTALACAO DE PYTHON E NODE.JS ===

:: --- INSTALAR PYTHON ---
echo [1/2] Baixando Python...
powershell -Command "Invoke-WebRequest -Uri https://www.python.org/ftp/python/3.12.2/python-3.12.2-amd64.exe -OutFile python-installer.exe"

echo Instalando Python...
python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

:: --- INSTALAR NODE.JS ---
echo [2/2] Baixando Node.js...
powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi -OutFile node-installer.msi"

echo Instalando Node.js...
msiexec /i node-installer.msi /quiet /norestart

echo.
echo === INSTALACAO FINALIZADA! ===
echo Abrindo novo terminal para continuar a configuração...
start cmd /k "02_configurar_e_iniciar_sistema.bat"
exit
