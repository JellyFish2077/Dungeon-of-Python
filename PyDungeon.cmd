@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python не найден в PATH.
  echo Установите Python 3 или запустите launch_game.py вручную.
  pause
  exit /b 1
)
python launch_standalone.py
if errorlevel 1 pause
