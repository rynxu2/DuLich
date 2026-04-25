@echo off
echo ========================================================
echo Khởi động đồng thời Web Admin Dashboard và Android App...
echo ========================================================

:: Chạy Admin Dashboard (Next.js) trong cửa sổ mới
echo [1] Dang khoi dong Web Admin Dashboard (thu muc: web)...
start "Web Admin Dashboard" cmd /k "cd web && npm run dev"

:: Chạy Android App (React Native) trong cửa sổ mới
echo [2] Dang khoi dong Android App (thu muc: frontend)...
start "Android App (React Native)" cmd /k "cd frontend && npm run android"

echo.
echo Hoan tat! 2 cua so Terminal da duoc mo de chay song song 2 ung dung.
echo Bam phim bat ky de thoat...
pause >nul
