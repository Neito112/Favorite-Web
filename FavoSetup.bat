@echo off
chcp 65001 >nul
title FAVO - SETUP PROJECT TOOL
color 0B
cls

echo ========================================================
echo        CONG CU CAI DAT DU AN TU DONG
echo ========================================================
echo.
echo  Script nay se giup ban:
echo  1. Lay code moi nhat tu GitHub ve may.
echo  2. Tu dong cai dat moi thu vien (npm install).
echo  3. Kiem tra moi truong (Node.js, Git).
echo.
echo ========================================================

:: 1. KIEM TRA MOI TRUONG
echo [1/3] Dang kiem tra moi truong...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai GIT! Vui long cai Git truoc.
    pause
    exit
)

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] May tinh chua cai NODE.JS! Vui long cai Node.js truoc.
    pause
    exit
)
echo [OK] Da tim thay Git va Node.js.
echo.

:: 2. MENU LUA CHON
echo Chon che do:
echo [1] Cai dat moi (Clone): Dung cho may tinh moi chua co code.
echo [2] Cap nhat (Pull):     Dung khi may da co code, muon lay ban moi nhat.
echo [3] Sua loi thu vien:    Xoa node_modules va cai lai tu dau (Fix loi crash).
echo.
set /p choice="Nhap lua chon (1-3): "

if "%choice%"=="1" goto CLONE
if "%choice%"=="2" goto PULL
if "%choice%"=="3" goto REINSTALL
goto END

:CLONE
echo.
echo [2/3] Dang tai code tu GitHub...
:: Thay doi link duoi day neu ban muon dung repo khac
git clone https://github.com/Neito112/Favorite-Web.git
if %errorlevel% neq 0 (
    echo [LOI] Khong the tai code. Co the thu muc 'Favorite-Web' da ton tai.
    echo Vui long xoa thu muc cu hoac chon che do [2] Cap nhat.
    pause
    exit
)
cd Favorite-Web
goto INSTALL

:PULL
echo.
echo [2/3] Dang cap nhat code moi nhat...
:: Kiem tra xem co dang o trong thu muc du an khong
if not exist "package.json" (
    echo [LOI] Khong tim thay file package.json!
    echo Hay dam bao ban de file .bat nay CUNG CAP voi thu muc Favorite-Web
    echo hoac ban dang chay no ben trong thu muc du an.
    pause
    exit
)
git pull origin main
goto INSTALL

:REINSTALL
echo.
echo [INFO] Dang xoa thu muc thu vien cu (node_modules)...
if exist "node_modules" (
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" (
    del /q "package-lock.json"
)
goto INSTALL

:INSTALL
echo.
echo [3/3] Dang cai dat cac thu vien can thiet...
echo Qua trinh nay co the mat 1-5 phut tuy mang...
echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Cai dat that bai. Vui long kiem tra ket noi mang.
) else (
    echo.
    echo ========================================================
    echo        CAI DAT HOAN TAT! SANS SANG DE CHAY.
    echo ========================================================
    echo Ban co the chay file 'TEST_APP.bat' hoac 'DEPLOY.bat' ngay bay gio.
)

:END
pause