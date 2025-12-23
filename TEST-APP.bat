@echo off
chcp 65001 >nul
title FAVO - DEV MODE (CHAY THU)
color 0B
cls

echo ========================================================
echo        DANG KHOI DONG CHE DO DUNG THU (DEV MODE)
echo ========================================================
echo.
echo  He thong se khoi dong Server va App ngay bay gio.
echo  Luu y: Khi sua code va luu (Ctrl+S), App se tu dong cap nhat.
echo.
echo ========================================================
echo Dang khoi dong... vui long cho...
echo.

call npm run "start:desktop"

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Khong the khoi dong.
    echo Hay dam bao ban da chay 'npm install' truoc do.
    