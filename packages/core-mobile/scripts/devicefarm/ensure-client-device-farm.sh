#!/usr/bin/env bash
#
# Ensure Node can resolve @aws-sdk/client-device-farm for trigger-devicefarm-api.js.
#
# Do NOT run `npm install` in packages/core-mobile: this package.json uses Yarn's
# "workspace:*" protocol and npm fails with:
#   npm error Unsupported URL Type "workspace:": workspace:*
#
# Flow:
# 1) If Node can resolve the module from cwd (including hoisted monorepo root), nothing to do.
# 2) Otherwise copy scripts/devicefarm/client-device-farm-isolated/ (package.json + lockfile) into
#    a temp directory, run npm ci for a reproducible tree, and prepend NODE_PATH.
#    The isolated package version must match @aws-sdk/client-device-farm in packages/core-mobile/package.json;
#    after bumping the SDK, run npm install in client-device-farm-isolated/ and commit package-lock.json.
#
# Usage (from packages/core-mobile, i.e. after `cd "$CORE_MOBILE_DIR"`):
#   source scripts/devicefarm/ensure-client-device-farm.sh
#   ensure_client_device_farm
#   node scripts/devicefarm/trigger-devicefarm-api.js
#   cleanup_client_device_farm_tmp   # optional; frees temp dir / restores NODE_PATH

DF_CLIENT_DEVICE_FARM_TMP=""
_DF_PREV_NODE_PATH="${NODE_PATH:-}"

ensure_client_device_farm() {
  if node -e "require.resolve('@aws-sdk/client-device-farm')" >/dev/null 2>&1; then
    return 0
  fi
  local _iso_dir
  _iso_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/client-device-farm-isolated"
  if [[ ! -f "$_iso_dir/package.json" ]] || [[ ! -f "$_iso_dir/package-lock.json" ]]; then
    echo "❌ Missing client-device-farm-isolated package.json or package-lock.json in $_iso_dir" >&2
    return 1
  fi
  if ! node -e '
const fs = require("fs");
const path = require("path");
const isoDir = process.argv[1];
const rootPkg = path.join(process.cwd(), "package.json");
const isoPkg = path.join(isoDir, "package.json");
const root = JSON.parse(fs.readFileSync(rootPkg, "utf8"));
const iso = JSON.parse(fs.readFileSync(isoPkg, "utf8"));
const rv = { ...root.dependencies, ...root.devDependencies }["@aws-sdk/client-device-farm"];
const iv = iso.dependencies["@aws-sdk/client-device-farm"];
if (!rv) {
  console.error("Missing @aws-sdk/client-device-farm in packages/core-mobile/package.json");
  process.exit(1);
}
if (rv !== iv) {
  console.error(
    "Version mismatch: package.json has @aws-sdk/client-device-farm " +
      rv +
      " but client-device-farm-isolated/package.json has " +
      iv +
      ". Update isolated/package.json, run npm install there, commit package-lock.json."
  );
  process.exit(1);
}
' "$_iso_dir"; then
    return 1
  fi
  echo "📦 @aws-sdk/client-device-farm not in node_modules; npm ci in temp dir (npm cannot install inside Yarn workspace root)."
  DF_CLIENT_DEVICE_FARM_TMP="$(mktemp -d)"
  if ! cp "$_iso_dir/package.json" "$_iso_dir/package-lock.json" "$DF_CLIENT_DEVICE_FARM_TMP/"; then
    rm -rf "$DF_CLIENT_DEVICE_FARM_TMP"
    DF_CLIENT_DEVICE_FARM_TMP=""
    return 1
  fi
  if ! (cd "$DF_CLIENT_DEVICE_FARM_TMP" && npm ci --silent --omit=dev); then
    rm -rf "$DF_CLIENT_DEVICE_FARM_TMP"
    DF_CLIENT_DEVICE_FARM_TMP=""
    return 1
  fi
  export NODE_PATH="$DF_CLIENT_DEVICE_FARM_TMP/node_modules${_DF_PREV_NODE_PATH:+:$_DF_PREV_NODE_PATH}"
}

cleanup_client_device_farm_tmp() {
  if [[ -n "${DF_CLIENT_DEVICE_FARM_TMP:-}" ]]; then
    rm -rf "$DF_CLIENT_DEVICE_FARM_TMP"
    DF_CLIENT_DEVICE_FARM_TMP=""
  fi
  export NODE_PATH="$_DF_PREV_NODE_PATH"
}
