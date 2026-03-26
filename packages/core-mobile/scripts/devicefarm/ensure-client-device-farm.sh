#!/usr/bin/env bash
#
# Ensure Node can resolve @aws-sdk/client-device-farm for trigger-devicefarm-api.js.
#
# Do NOT run `npm install` in packages/core-mobile: this package.json uses Yarn's
# "workspace:*" protocol and npm fails with:
#   npm error Unsupported URL Type "workspace:": workspace:*
#
# Flow:
# 1) If the workspace already has the module (Bitrise after `yarn install`), nothing to do.
# 2) Otherwise install only @aws-sdk/client-device-farm in a temp directory (same version as
#    packages/core-mobile/package.json) and prepend NODE_PATH.
#
# Usage (from packages/core-mobile, i.e. after `cd "$CORE_MOBILE_DIR"`):
#   source scripts/devicefarm/ensure-client-device-farm.sh
#   ensure_client_device_farm
#   node scripts/devicefarm/trigger-devicefarm-api.js
#   cleanup_client_device_farm_tmp   # optional; frees temp dir / restores NODE_PATH

DF_CLIENT_DEVICE_FARM_TMP=""
_DF_PREV_NODE_PATH="${NODE_PATH:-}"

ensure_client_device_farm() {
  if [[ -d "node_modules/@aws-sdk/client-device-farm" ]]; then
    return 0
  fi
  echo "📦 @aws-sdk/client-device-farm not in node_modules; installing in temp dir (npm cannot install inside Yarn workspace root)."
  DF_CLIENT_DEVICE_FARM_TMP="$(mktemp -d)"
  if ! node -e '
const fs = require("fs");
const path = require("path");
const tmp = process.argv[1];
const pkgPath = path.join(process.cwd(), "package.json");
const p = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const d = { ...p.dependencies, ...p.devDependencies };
const v = d["@aws-sdk/client-device-farm"];
if (!v) {
  console.error("Missing @aws-sdk/client-device-farm in package.json");
  process.exit(1);
}
fs.writeFileSync(
  path.join(tmp, "package.json"),
  JSON.stringify({
    private: true,
    dependencies: { "@aws-sdk/client-device-farm": v }
  })
);
' "$DF_CLIENT_DEVICE_FARM_TMP"; then
    rm -rf "$DF_CLIENT_DEVICE_FARM_TMP"
    DF_CLIENT_DEVICE_FARM_TMP=""
    return 1
  fi
  (cd "$DF_CLIENT_DEVICE_FARM_TMP" && npm install --silent)
  export NODE_PATH="$DF_CLIENT_DEVICE_FARM_TMP/node_modules${_DF_PREV_NODE_PATH:+:$_DF_PREV_NODE_PATH}"
}

cleanup_client_device_farm_tmp() {
  if [[ -n "${DF_CLIENT_DEVICE_FARM_TMP:-}" ]]; then
    rm -rf "$DF_CLIENT_DEVICE_FARM_TMP"
    DF_CLIENT_DEVICE_FARM_TMP=""
  fi
  export NODE_PATH="$_DF_PREV_NODE_PATH"
}
