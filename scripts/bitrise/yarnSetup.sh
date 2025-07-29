#!/usr/bin/env bash
set -eo pipefail

echo "== Enabling corepack =="
corepack enable || echo "⚠️ Corepack not available"

echo "== Yarn version =="
yarn --version || exit 1

echo "== Installing dependencies =="
yarn install --immutable || exit 1

if [ -f package.json ] && jq -e '.scripts.setup' package.json >/dev/null; then
  echo "== Running yarn setup =="
  yarn setup || echo "⚠️ yarn setup failed — continuing"
else
  echo "⚠️ No yarn setup script defined — skipping"
fi