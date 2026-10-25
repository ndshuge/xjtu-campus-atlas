@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 需要 Node.js 才能启动本机服务器。也可直接打开 README 中的线上版本。
  pause
  exit /b 1
)
start "西交校园 3D" "http://127.0.0.1:18866/"
node scripts\serve.mjs
pause
