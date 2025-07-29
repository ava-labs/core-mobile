#!/usr/bin/env bash

set -eo pipefail

echo "== Enabling corepack =="
corepack enable || echo "⚠️ Corepack not available"

echo "== Yarn version =="
yarn --version || exit 1

echo "== Installing dependencies =="

# fallback if /etc/issue doesn't exist
if ! cat /etc/issue 2>/dev/null; then
  yarn install --immutable || exit 1
  yarn setup || echo "⚠️ 'yarn setup' failed or not defined"
else 
  stack=$(cat /etc/issue)
fi

if [[ $stack == *Ubuntu* ]]; then
    echo "Ubuntu stack detected — fixing node_modules permissions"
    sudo chmod -R u+w node_modules || true
    yarn install --immutable || exit 1
    yarn setup || echo "⚠️ 'yarn setup' failed or not defined"
fi