@echo off
chcp 65001 >nul
title FAVO APP - AUTO DEPLOY TOOL
color 0A
cls

echo ========================================================
echo        CONG CU DAY CODE TU DONG (CI/CD)
echo ========================================================
echo.
echo  Luu y: Code se duoc tu dong day len GitHub.
echo  GitHub Actions se tu dong Build file .exe neu ban tang version.
echo.
echo  Chon loai cap nhat:
echo.
echo  [1] Patch (Sua loi nho):      Tang so cuoi (Vi du: 1.0.0 len 1.0.1)
echo  [2] Minor (Tinh nang moi):    Tang so giua (Vi du: 1.0.0 len 1.1.0)
echo  [3] Major (Thay doi lon):     Tang so dau  (Vi du: 1.0.0 len 2.0.0)
echo  [4] Chi luu code (Commit):    Khong tang version (KHONG BUILD)
echo.
echo ========================================================
set /p choice="Nhap lua chon cua ban (1-4): "

if "%choice%"=="1" goto PATCH
if "%choice%"=="2" goto MINOR
if "%choice%"=="3" goto MAJOR
if "%choice%"=="4" goto JUST_COMMIT
goto END

:PATCH
set vtype=patch
goto VERSIONING

:MINOR
set vtype=minor
goto VERSIONING

:MAJOR
set vtype=major
goto VERSIONING

:VERSIONING
echo.
echo --------------------------------------------------------
echo [BUOC 1/4] Dang luu cac thay doi hien tai...
git add .
git commit -m "Pre-release commit"

echo.
echo [BUOC 2/4] Dang tang phien ban (%vtype%)...
call npm version %vtype% --force

echo.
echo [BUOC 3/4] Dang day code len GitHub...
git push origin main

echo.
echo [BUOC 4/4] Dang day Tags de kich hoat Build...
git push origin --tags

goto SUCCESS

:JUST_COMMIT
echo.
set /p msg="Nhap noi dung commit: "
echo.
echo [BUOC 1/2] Dang luu code...
git add .
git commit -m "%msg%"
echo.
echo [BUOC 2/2] Dang day len GitHub...
git push origin main
echo.
echo (Luu y: Ban chi day code len, GitHub se KHONG build file exe vi chua co Tag)
goto END

:SUCCESS
echo.
echo ========================================================
echo    THANH CONG! GITHUB DANG TIEN HANH BUILD APP.
echo    Vui long cho 3-5 phut va kiem tra muc 'Actions' hoac 'Releases'.
echo ========================================================
pause
exit

:END
echo.
echo Da hoan tat.
pause