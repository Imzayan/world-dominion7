@echo off
chcp 65001 >nul
title World Dominion - Push to GitHub

echo ============================================
echo   World Dominion - ارسال به GitHub
echo ============================================
echo.
echo قبل از اجرا:
echo   1) در github.com یک مخزن (Repository) خالی بسازید
echo   2) این فایل را با Notepad باز کنید و آدرس مخزن خود را
echo      جای YOUR-USERNAME/REPO-NAME بگذارید
echo.
pause

set REPO_URL=https://github.com/YOUR-USERNAME/REPO-NAME.git

cd /d "%~dp0"

git init
git add .
git commit -m "World Dominion - online multiplayer with database"
git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ============================================
echo   تمام شد! کد شما روی GitHub قرار گرفت.
echo   حالا به render.com بروید و Web Service بسازید.
echo ============================================
pause
