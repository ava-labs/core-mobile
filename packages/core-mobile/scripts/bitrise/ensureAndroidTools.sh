#!/usr/bin/env bash
set -euo pipefail

# Fast replacement for install-missing-android-tools@3.
# That step ran a full Gradle configuration pass (~3.5 min) on every build even
# though the Bitrise Android stack already ships the NDK and SDK we need. This
# script verifies the NDK, SDK platform, and build-tools are present and only
# installs whichever of them is missing.

# Must match ndkVersion in packages/core-mobile/android/build.gradle
NDK_VERSION="27.1.12297006"

echo "Ensuring android/gradlew is executable..."
chmod +x android/gradlew

SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/opt/android-sdk-linux}}"
echo "Using Android SDK root: $SDK_ROOT"

if [ -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
    SDKMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
elif command -v sdkmanager >/dev/null 2>&1; then
    SDKMANAGER="$(command -v sdkmanager)"
else
    echo "ERROR: could not find sdkmanager in $SDK_ROOT/cmdline-tools/latest/bin or on PATH" >&2
    exit 1
fi
echo "Using sdkmanager: $SDKMANAGER"

# Accept licenses BEFORE any install so installs never prompt. Installs below
# run with stdin closed (< /dev/null) instead of `yes |`: under pipefail, `yes`
# dies with SIGPIPE (exit 141) when sdkmanager exits first, failing the build
# even when the install succeeded. With licenses pre-accepted, a prompt should
# never appear; if one ever does, the install fails fast instead of hanging.
echo "Accepting Android SDK licenses..."
yes | "$SDKMANAGER" --licenses > /dev/null 2>&1 || true

if [ -d "$SDK_ROOT/ndk/$NDK_VERSION" ]; then
    echo "NDK $NDK_VERSION already installed at $SDK_ROOT/ndk/$NDK_VERSION, skipping install."
else
    echo "NDK $NDK_VERSION not found, installing..."
    "$SDKMANAGER" "ndk;$NDK_VERSION" < /dev/null
    echo "NDK $NDK_VERSION installed."
fi

BUILD_GRADLE="android/build.gradle"

COMPILE_SDK_VERSION="$(grep -E '^[[:space:]]*compileSdkVersion[[:space:]]*=[[:space:]]*[0-9]+' "$BUILD_GRADLE" | head -1 | sed -E 's/^[[:space:]]*compileSdkVersion[[:space:]]*=[[:space:]]*([0-9]+).*/\1/')"
if [ -z "$COMPILE_SDK_VERSION" ]; then
    echo "ERROR: could not parse compileSdkVersion from $BUILD_GRADLE" >&2
    exit 1
fi

BUILD_TOOLS_VERSION="$(grep -E '^[[:space:]]*buildToolsVersion[[:space:]]*=[[:space:]]*"[^"]+"' "$BUILD_GRADLE" | head -1 | sed -E 's/^[[:space:]]*buildToolsVersion[[:space:]]*=[[:space:]]*"([^"]+)".*/\1/')"
if [ -z "$BUILD_TOOLS_VERSION" ]; then
    echo "ERROR: could not parse buildToolsVersion from $BUILD_GRADLE" >&2
    exit 1
fi

if [ -d "$SDK_ROOT/platforms/android-$COMPILE_SDK_VERSION" ]; then
    echo "SDK platform android-$COMPILE_SDK_VERSION already installed, skipping install."
else
    echo "SDK platform android-$COMPILE_SDK_VERSION not found, installing..."
    "$SDKMANAGER" "platforms;android-$COMPILE_SDK_VERSION" < /dev/null
    echo "SDK platform android-$COMPILE_SDK_VERSION installed."
fi

if [ -d "$SDK_ROOT/build-tools/$BUILD_TOOLS_VERSION" ]; then
    echo "Build-tools $BUILD_TOOLS_VERSION already installed, skipping install."
else
    echo "Build-tools $BUILD_TOOLS_VERSION not found, installing..."
    "$SDKMANAGER" "build-tools;$BUILD_TOOLS_VERSION" < /dev/null
    echo "Build-tools $BUILD_TOOLS_VERSION installed."
fi

echo "Done ensuring Android SDK components."
