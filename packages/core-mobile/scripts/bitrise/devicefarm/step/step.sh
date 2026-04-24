#!/usr/bin/env bash
#
# Bitrise entry for the in-repo Device Farm step.
# Routes to androidDeviceFarmRegression.sh or iosDeviceFarmRegression.sh based on PLATFORM.
#
set -euo pipefail

if [[ -z "${BITRISE_SOURCE_DIR:-}" ]]; then
  echo "❌ BITRISE_SOURCE_DIR is not set. This step is intended to run on Bitrise CI."
  exit 1
fi

# Bitrise copies ONLY this step folder to a temp dir (e.g. /tmp/.../step_src/) — sibling files like
# androidDeviceFarmRegression.sh are NOT copied. Never resolve via dirname(BASH_SOURCE)/../...
#
# BITRISE_SOURCE_DIR may be monorepo root or packages/core-mobile (after "Change Working Directory").
DEVICEFARM_SCRIPTS_DIR=""
if [[ -d "${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm" ]]; then
  DEVICEFARM_SCRIPTS_DIR="${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm"
elif [[ -d "${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm" ]]; then
  DEVICEFARM_SCRIPTS_DIR="${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm"
fi

if [[ -z "$DEVICEFARM_SCRIPTS_DIR" ]]; then
  echo "❌ Device Farm scripts directory not found under BITRISE_SOURCE_DIR=${BITRISE_SOURCE_DIR}"
  exit 1
fi

# Normalize PLATFORM (Bitrise sets Android / iOS with capital first letter)
PLATFORM_LOWER="$(echo "${PLATFORM:-android}" | tr '[:upper:]' '[:lower:]')"

if [[ "$PLATFORM_LOWER" == "ios" ]]; then
  REGRESSION_SCRIPT="${DEVICEFARM_SCRIPTS_DIR}/iosDeviceFarmRegression.sh"
  echo "▶ Running Core Mobile iOS Device Farm step (API upload + schedule)..."
else
  REGRESSION_SCRIPT="${DEVICEFARM_SCRIPTS_DIR}/androidDeviceFarmRegression.sh"
  echo "▶ Running Core Mobile Android Device Farm step (API upload + schedule)..."
fi

if [[ ! -f "$REGRESSION_SCRIPT" ]]; then
  echo "❌ Device Farm regression script not found: $REGRESSION_SCRIPT"
  exit 1
fi

exec bash "$REGRESSION_SCRIPT"
