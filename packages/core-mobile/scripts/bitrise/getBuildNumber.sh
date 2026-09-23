#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# when a pipeline starts, it triggers both iOS and Android workflows
# in order for iOS and Android to have different build numbers, we increment build number by 1 for Android
#
# CP-15085: E2E builds pin the build number to a constant.
#
# WHY: the "Set Android Version" step (change-android-versioncode-and-versionname)
# rewrites android/app/build.gradle IN PLACE, replacing
# `versionCode rootProject.ext.appBuildNumber` with a literal. A fresh build
# number every run therefore changes the bytes of a Gradle BUILD SCRIPT on every
# run, invalidating every task downstream of it and capping the Bitrise Build
# Cache hit rate. Pinning it keeps the file byte-identical between E2E builds.
# `1` is deliberately the same value checked into android/build.gradle.
#
# RISKS — read before widening this:
#
#   1. SAFETY RESTS ON AN INVARIANT, NOT ON STRUCTURE. This is only safe
#      because no workflow that sets E2E=true ever uploads to a store. That
#      held for all 12 workflows as of 2026-09-23 (E2E=true <=> publishes
#      nothing). If a workflow is ever added that sets E2E=true AND deploys,
#      Google Play will reject it — version codes must strictly increase — or
#      it will silently ship a non-unique build. Re-check that invariant
#      before setting E2E=true on anything new.
#
#   2. DOWNGRADE INSTALLS FAIL. Installing versionCode 1 over an already
#      installed higher version code fails with
#      INSTALL_FAILED_VERSION_DOWNGRADE. AWS Device Farm wipes devices between
#      runs so it does not bite in CI, but a persistent local device or
#      emulator will need an uninstall first.
#
#   3. E2E BUILDS ARE NO LONGER DISTINGUISHABLE BY VERSION CODE. Anything that
#      identifies a build that way (crash grouping, TestRail attachments)
#      cannot tell two E2E builds apart. Use BITRISE_BUILD_NUMBER instead.
#
if [ "$E2E" = "true" ]; then
  buildNumber=1
elif [ "$PLATFORM" = "iOS" ]; then
  buildNumber=$BITRISE_BUILD_NUMBER
else
  buildNumber=$((BITRISE_BUILD_NUMBER+1))
fi

envman add --key BUILD_NUMBER --value "${buildNumber}"