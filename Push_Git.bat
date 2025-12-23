@echo off
:: Thiết lập hiển thị tiếng Việt và UTF-8
chcp 65001 >nul
setlocal

:: ====================================================
:: KHU VỰC CẤU HÌNH TỰ ĐỘNG
:: ====================================================
set "MY_NAME=Neito112"
set "MY_EMAIL=orenji11299@gmail.com"
:: ====================================================

echo ==============================================
echo      GITHUB AUTO SYNC - %MY_NAME%
echo ==============================================

:: 1. TỰ ĐỘNG CẤU HÌNH DANH TÍNH (Cho máy mới)
:: Kiểm tra xem máy này đã khai báo tên chưa, nếu chưa thì tự điền thông tin của bạn vào
git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    echo [AUTO-FIX] Phat hien may moi chua cau hinh. Dang thiet lap...
    git config --global user.name "%MY_NAME%"
    git config --global user.email "%MY_EMAIL%"
    echo [OK] Da thiet lap: %MY_NAME% - %MY_EMAIL%
)

:: 2. TỰ ĐỘNG PHÁT HIỆN NHÁNH (Branch)
:: Lệnh này tự tìm xem bạn đang ở nhánh main hay master,...
for /f "tokens=*" %%a in ('git branch --show-current') do set CURRENT_BRANCH=%%a

if "%CURRENT_BRANCH%"=="" (
    echo [LOI] Khong tim thay Git. Ban hay chac chan da chay 'git init'
    pause
    exit
)
echo [INFO] Nhanh hien tai: %CURRENT_BRANCH%

:: 3. KÉO CODE VỀ TRƯỚC (Tránh xung đột)
echo.
echo [1/4] Dang dong bo code tu Server ve (git pull)...
git pull origin %CURRENT_BRANCH%

:: 4. THÊM FILE
echo.
echo [2/4] Dang them file (git add)...
git add .

:: 5. NHẬP NỘI DUNG (Nếu lười ấn Enter luôn)
echo.
set /p commitMsg="Nhap ghi chu (An Enter de lay gio tu dong): "

if "%commitMsg%"=="" (
    set commitMsg=Auto Update %date% %time%
)

:: 6. ĐÓNG GÓI
echo.
echo [3/4] Dang commit voi noi dung: "%commitMsg%"...
git commit -m "%commitMsg%"

:: 7. ĐẨY LÊN GITHUB
echo.
echo [4/4] Dang day len GitHub (git push)...
git push origin %CURRENT_BRANCH%

echo.
echo ==============================================
echo      THANH CONG! CODE DA DUOC CAP NHAT
echo ==============================================
echo Link: https://github.com/%MY_NAME%/Favorite-Web
pause