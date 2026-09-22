@echo off
chcp 65001 >nul
title World Dominion - Push to GitHub

echo ============================================
echo   World Dominion - ارسال به GitHub
echo   مخزن: Imzayan/world-dominion7
echo ============================================
echo.
echo توجه: این اسکریپت محتوای قبلی مخزن را با نسخه
echo جدید و کامل بازی جایگزین می‌کند (Force Push).
echo.
pause

cd /d "%~dp0"

git init
git add .
git commit -m "World Dominion - online multiplayer with database (full version)"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/Imzayan/world-dominion7.git
git push -f -u origin main

echo.
echo ============================================
echo   تمام شد! نسخه کامل روی GitHub قرار گرفت.
echo   حالا به render.com بروید و Web Service بسازید.
echo ============================================
pause
