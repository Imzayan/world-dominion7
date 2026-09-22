#!/usr/bin/env bash
# =====================================================
#  World Dominion - Push to GitHub
#  1) Create an EMPTY repository on github.com
#  2) Edit REPO_URL below (your repo address)
#  3) Run:  bash push-to-github.sh
# =====================================================

REPO_URL="https://github.com/YOUR-USERNAME/REPO-NAME.git"

cd "$(dirname "$0")"

git init
git add .
git commit -m "World Dominion - online multiplayer with database"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin "$REPO_URL"
git push -u origin main

echo "Done! Now go to render.com and create a Web Service."
