#!/bin/bash
set -euo pipefail

# ------------------- Configuration -------------------
# This script builds secp256k1 for all Android ABIs and creates prebuilt
# libraries that can be committed to the repository, eliminating the need
# to build from source during CI.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_DIR="$(dirname "$ANDROID_DIR")"
PREBUILT_DIR="$ANDROID_DIR/prebuilt"

# Read version from build.gradle
SECP_TAG="v0.7.0"

echo "========================================"
echo "Building secp256k1 prebuilt Android libraries"
echo "Version: ${SECP_TAG}"
echo "========================================"

# ------------------- Clean previous prebuilts -------------------
echo "[secp] Cleaning previous prebuilts..."
rm -rf "$PREBUILT_DIR"
mkdir -p "$PREBUILT_DIR"

# ------------------- Build using Gradle -------------------
echo "[secp] Building secp256k1 for all ABIs..."

# Find the core-mobile android directory with gradlew
CORE_MOBILE_ANDROID="$PACKAGE_DIR/../core-mobile/android"

if [ ! -f "$CORE_MOBILE_ANDROID/gradlew" ]; then
    echo "ERROR: gradlew not found at $CORE_MOBILE_ANDROID"
    echo "Make sure you're running from the monorepo root"
    exit 1
fi

# Navigate to core-mobile android directory and build the crypto module
pushd "$CORE_MOBILE_ANDROID" > /dev/null

# Clean previous builds
./gradlew :react-native-nitro-avalabs-crypto:cleanSecpAndroid

# Build for all ABIs (force build from source)
./gradlew :react-native-nitro-avalabs-crypto:buildSecpAllAndroid -PforceSecpBuild=true

popd > /dev/null

# ------------------- Copy built libraries -------------------
echo ""
echo "[secp] Copying built libraries to prebuilt directory..."

for abi in armeabi-v7a arm64-v8a; do
    SRC="$ANDROID_DIR/build/outputs/android/$abi/lib/libsecp256k1.so"
    DEST_DIR="$PREBUILT_DIR/$abi"

    if [ -f "$SRC" ]; then
        mkdir -p "$DEST_DIR"
        cp "$SRC" "$DEST_DIR/"
        echo "[secp:${abi}] Copied libsecp256k1.so ($(du -h "$SRC" | cut -f1))"
    else
        echo "[secp:${abi}] ERROR: $SRC not found"
        exit 1
    fi
done

# ------------------- Copy headers -------------------
HEADERS_SRC="$ANDROID_DIR/build/outputs/include"
HEADERS_DEST="$PREBUILT_DIR/include"

if [ -d "$HEADERS_SRC" ]; then
    cp -r "$HEADERS_SRC" "$HEADERS_DEST"
    echo "[secp] Copied headers"
else
    echo "[secp] WARNING: Headers not found at $HEADERS_SRC"
fi

# ------------------- Create VERSION file -------------------
echo "$SECP_TAG" > "$PREBUILT_DIR/VERSION"

# ------------------- Verify -------------------
echo ""
echo "========================================"
echo "Prebuilt Android libraries created successfully!"
echo "========================================"
echo ""
echo "Contents of ${PREBUILT_DIR}:"
ls -la "$PREBUILT_DIR"
echo ""

for abi in armeabi-v7a arm64-v8a; do
    if [ -f "$PREBUILT_DIR/$abi/libsecp256k1.so" ]; then
        echo "${abi}:"
        file "$PREBUILT_DIR/$abi/libsecp256k1.so"
    fi
done

echo ""
echo "VERSION: $(cat "$PREBUILT_DIR/VERSION")"
echo ""
echo "Total size:"
du -sh "$PREBUILT_DIR"
echo ""
echo "Done! You can now commit the prebuilt directory."
