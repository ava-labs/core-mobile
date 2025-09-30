#!/usr/bin/env bash
set -ex

asdf install nodejs 20.19.0 || true
asdf global nodejs 20.19.0
asdf reshim nodejs

node -v

npm install -g appium@next
npm install -g @wdio/cli

appium driver install uiautomator2 || echo "uiautomator2 already installed, skipping"

if ! command -v yarn &> /dev/null; then
    echo "download yarn"
    asdf plugin add yarn || true
    asdf install yarn latest
    asdf global yarn latest
    asdf reshim nodejs
fi
yarn -v

yarn appium:android
