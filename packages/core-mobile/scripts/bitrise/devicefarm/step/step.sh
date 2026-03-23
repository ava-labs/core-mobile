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

REGRESSION_SCRIPT="${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm/androidDeviceFarmRegression.sh"

if [[ ! -f "$REGRESSION_SCRIPT" ]]; then
  echo "❌ Device Farm regression script not found: $REGRESSION_SCRIPT"
  exit 1
fi

echo "▶ Running Core Mobile Device Farm step (API upload + schedule)..."
exec bash "$REGRESSION_SCRIPT"
