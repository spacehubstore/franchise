#!/bin/bash
# Сборка лендинга: Astro → _src/dist → корень репозитория. Служебные файлы корня не трогаем.
set -e
cd "$(dirname "$0")/_src"
npm run build --silent
cd ..
rsync -a --delete \
  --exclude ".git" --exclude "_src" --exclude "build.sh" --exclude "README.md" \
  --exclude "CNAME" --exclude ".nojekyll" \
  _src/dist/ ./
echo "build ok"
