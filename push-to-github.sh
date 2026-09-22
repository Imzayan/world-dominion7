#!/usr/bin/env bash
# =====================================================
#  World Dominion - Push to GitHub
#  Repo: Imzayan/world-dominion7
#  Run:  bash push-to-github.sh
#  NOTE: force-push replaces old repo content
# =====================================================

REPO_URL="https://github.com/Imzayan/world-dominion7.git"

cd "$(dirname "$0")"

git init
git add .
git commit -m "World Dominion - online multiplayer with database (full version)"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
git push -f -u origin main

echo "Done! Full version pushed. Now create a Web Service on render.com"
