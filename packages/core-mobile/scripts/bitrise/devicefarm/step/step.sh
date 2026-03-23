#!/usr/bin/env bash
#
# Bitrise entry for the in-repo Device Farm step.
# Delegates to androidDeviceFarmRegression.sh (packages tests, uploads, schedules run).
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
REGRESSION_SCRIPT=""
if [[ -f "${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh" ]]; then
  REGRESSION_SCRIPT="${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh"
elif [[ -f "${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh" ]]; then
  REGRESSION_SCRIPT="${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh"
fi

if [[ -z "$REGRESSION_SCRIPT" ]] || [[ ! -f "$REGRESSION_SCRIPT" ]]; then
  echo "❌ Device Farm regression script not found under BITRISE_SOURCE_DIR=${BITRISE_SOURCE_DIR}"
  echo "   Tried:"
  echo "     - \${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh"
  echo "     - \${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh"
  exit 1
fi

echo "▶ Running Core Mobile Device Farm step (API upload + schedule)..."
exec bash "$REGRESSION_SCRIPT"
