#!/usr/bin/env bash
#
set -euo pipefail

# 1. Set Device Farm scripts directory
DEVICEFARM_SCRIPTS_DIR=""
if [[ -d "${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm" ]]; then
  DEVICEFARM_SCRIPTS_DIR="${BITRISE_SOURCE_DIR}/packages/core-mobile/scripts/bitrise/devicefarm"
elif [[ -d "${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm" ]]; then
  DEVICEFARM_SCRIPTS_DIR="${BITRISE_SOURCE_DIR}/scripts/bitrise/devicefarm"
fi


# 2. Set regression script based on PLATFORM and test type
PLATFORM_LOWER="$(echo "${PLATFORM:-android}" | tr '[:upper:]' '[:lower:]')"

if [[ "${IS_SEEDLESS_TRANSACTIONS:-false}" == "true" ]]; then
  if [[ "$PLATFORM_LOWER" == "ios" ]]; then
    REGRESSION_SCRIPT="${DEVICEFARM_SCRIPTS_DIR}/ios/iosSeedlessTransactionsRegression.sh"
    echo "Test iOS - Seedless Transactions"
  else
    REGRESSION_SCRIPT="${DEVICEFARM_SCRIPTS_DIR}/android/androidSeedlessTransactionsRegression.sh"
    echo "Test Android - Seedless Transactions"
  fi
elif [[ "$PLATFORM_LOWER" == "ios" ]]; then
  REGRESSION_SCRIPT="${DEVICEFARM_SCRIPTS_DIR}/ios/iosDeviceFarmRegression.sh"
  echo "Test iOS"
else
  REGRESSION_SCRIPT="${DEVICEFARM_SCRIPTS_DIR}/android/androidDeviceFarmRegression.sh"
  echo "Test Android"
fi

exec bash "$REGRESSION_SCRIPT"
