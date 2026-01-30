#!/usr/bin/env bash
set -euo pipefail

# ------------------- Configuration -------------------
# This script builds secp256k1 for all iOS architectures and creates a prebuilt
# XCFramework that can be committed to the repository, eliminating the need to
# build from source during CI.

SECP_REPO_URL=${SECP_REPO_URL:-"https://github.com/bitcoin-core/secp256k1.git"}
SECP_TAG=${SECP_TAG:-"v0.7.0"}
MODULE_FLAGS=${SECP_MODULES:-"--enable-module-extrakeys --enable-module-schnorrsig"}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(dirname "${SCRIPT_DIR}")"
ROOT_DIR="$(dirname "${IOS_DIR}")"

WORK_DIR="${IOS_DIR}/secp256k1-src"
BUILD_DIR="${IOS_DIR}/secp-build"
PREBUILT_DIR="${IOS_DIR}/prebuilt"

echo "========================================"
echo "Building secp256k1 prebuilt XCFramework"
echo "Version: ${SECP_TAG}"
echo "========================================"

# ------------------- Homebrew tools -------------------
BREW_PREFIX="$((/usr/bin/env brew --prefix) 2>/dev/null || true)"
if [[ -n "$BREW_PREFIX" && -d "$BREW_PREFIX" ]]; then
  export PATH="$BREW_PREFIX/bin:$BREW_PREFIX/opt/automake/bin:$BREW_PREFIX/opt/autoconf/bin:$BREW_PREFIX/opt/libtool/bin:$PATH"
fi
for p in /opt/homebrew/bin /usr/local/bin; do
  [[ -d "$p" ]] && case ":$PATH:" in *":$p:"*) ;; *) export PATH="$p:$PATH";; esac
done

if ! command -v autoreconf >/dev/null 2>&1; then
  echo "[secp] ERROR: 'autoreconf' not found. Install: brew install autoconf automake libtool"
  exit 1
fi

# ------------------- Clean and setup -------------------
echo "[secp] Cleaning previous builds..."
rm -rf "${WORK_DIR}" "${BUILD_DIR}" "${PREBUILT_DIR}"
mkdir -p "${WORK_DIR}" "${BUILD_DIR}" "${PREBUILT_DIR}"

# ------------------- Clone -------------------
echo "[secp] Cloning ${SECP_REPO_URL}@${SECP_TAG}..."
git clone --depth 1 --branch "${SECP_TAG}" "${SECP_REPO_URL}" "${WORK_DIR}"

export LIBTOOLIZE="${LIBTOOLIZE:-glibtoolize}"
export LIBTOOL="${LIBTOOL:-glibtool}"

pushd "${WORK_DIR}" >/dev/null
echo "[secp] Running autogen.sh..."
bash ./autogen.sh
popd >/dev/null

# ------------------- Build helper -------------------
build_one() {
  local sdk="$1"   # iphoneos / iphonesimulator
  local arch="$2"  # arm64 / x86_64
  local host="$3"  # aarch64-apple-darwin / x86_64-apple-darwin

  # ---- Clean previous build ----
  echo "[secp] Cleaning old objects for ${sdk}/${arch}..."
  (cd "${WORK_DIR}" && make distclean || true)
  find "${WORK_DIR}" -name "*.o" -o -name "*.lo" -o -name "*.la" -o -name "*.a" -delete 2>/dev/null || true
  rm -rf "${WORK_DIR}/.libs"

  # ---- SDK / compiler ----
  local SDKROOT=$(xcrun --sdk "${sdk}" --show-sdk-path)
  local CC=$(xcrun --sdk "${sdk}" -f clang)
  local CXX=$(xcrun --sdk "${sdk}" -f clang++)

  # ---- Flags ----
  local ARCH_FLAG="-arch ${arch}"
  local MIN_VERSION
  local TARGET_FLAG=""
  local DEPLOYMENT_TARGET="${IPHONEOS_DEPLOYMENT_TARGET:-12.0}"

  if [[ "${sdk}" == "iphonesimulator" ]]; then
    MIN_VERSION="-mios-simulator-version-min=${DEPLOYMENT_TARGET}"
    TARGET_FLAG="-target ${arch}-apple-ios${DEPLOYMENT_TARGET}-simulator"
  else
    MIN_VERSION="-miphoneos-version-min=${DEPLOYMENT_TARGET}"
  fi

  local CFLAGS="-O2 -fPIC -fembed-bitcode ${ARCH_FLAG} ${TARGET_FLAG} -isysroot ${SDKROOT} ${MIN_VERSION}"
  local LDFLAGS="${ARCH_FLAG} ${TARGET_FLAG} -isysroot ${SDKROOT} ${MIN_VERSION}"

  local PREFIX="${BUILD_DIR}/${sdk}-${arch}"
  mkdir -p "${PREFIX}"

  echo "[secp] Configuring ${sdk}/${arch}..."
  (
    cd "${WORK_DIR}"
    env \
      CC="${CC}" CXX="${CXX}" \
      CFLAGS="${CFLAGS}" LDFLAGS="${LDFLAGS}" \
      LIBTOOLIZE="${LIBTOOLIZE}" LIBTOOL="${LIBTOOL}" \
      ./configure \
        --host="${host}" \
        --enable-shared=no --enable-static \
        --with-pic \
        --disable-benchmark --disable-tests \
        --prefix="${PREFIX}" \
        ${MODULE_FLAGS}
    make -j$(sysctl -n hw.ncpu)
    make install
  )

  # ---- Verify slice ----
  local OUT_LIB="${PREFIX}/lib/libsecp256k1.a"
  if [[ -f "${OUT_LIB}" ]]; then
    local INFO=$(lipo -info "${OUT_LIB}")
    echo "[secp] Built ${sdk}/${arch}: ${INFO}"
  else
    echo "[secp] ERROR: Failed to build ${sdk}/${arch}"
    exit 1
  fi
}

# ------------------- Build all slices -------------------
echo ""
echo "Building device slice (arm64)..."
build_one iphoneos arm64 aarch64-apple-darwin

echo ""
echo "Building simulator slice (arm64)..."
build_one iphonesimulator arm64 aarch64-apple-darwin

echo ""
echo "Building simulator slice (x86_64)..."
build_one iphonesimulator x86_64 x86_64-apple-darwin

# ------------------- Create fat simulator library -------------------
echo ""
echo "[secp] Creating fat simulator library (arm64 + x86_64)..."

SIM_ARM64_LIB="${BUILD_DIR}/iphonesimulator-arm64/lib/libsecp256k1.a"
SIM_X64_LIB="${BUILD_DIR}/iphonesimulator-x86_64/lib/libsecp256k1.a"
FAT_SIM_DIR="${BUILD_DIR}/iphonesimulator-universal"
FAT_SIM_LIB="${FAT_SIM_DIR}/lib/libsecp256k1.a"

mkdir -p "${FAT_SIM_DIR}/lib"
lipo -create "${SIM_ARM64_LIB}" "${SIM_X64_LIB}" -output "${FAT_SIM_LIB}"

echo "[secp] Fat simulator library: $(lipo -info "${FAT_SIM_LIB}")"

# ------------------- Copy headers -------------------
echo ""
echo "[secp] Copying headers..."
mkdir -p "${PREBUILT_DIR}/include"
cp -R "${BUILD_DIR}/iphoneos-arm64/include/"* "${PREBUILT_DIR}/include/"

# ------------------- Create XCFramework -------------------
echo ""
echo "[secp] Creating XCFramework..."

DEV_LIB="${BUILD_DIR}/iphoneos-arm64/lib/libsecp256k1.a"
XC_OUT="${PREBUILT_DIR}/secp256k1.xcframework"

rm -rf "${XC_OUT}"

xcodebuild -create-xcframework \
  -library "${DEV_LIB}" -headers "${PREBUILT_DIR}/include" \
  -library "${FAT_SIM_LIB}" -headers "${PREBUILT_DIR}/include" \
  -output "${XC_OUT}"

# ------------------- Create VERSION file -------------------
echo "${SECP_TAG}" > "${PREBUILT_DIR}/VERSION"

# ------------------- Verify -------------------
echo ""
echo "========================================"
echo "Prebuilt XCFramework created successfully!"
echo "========================================"
echo ""
echo "Contents of ${PREBUILT_DIR}:"
ls -la "${PREBUILT_DIR}"
echo ""
echo "XCFramework contents:"
ls -la "${XC_OUT}"
echo ""
echo "Device library:"
lipo -info "${XC_OUT}/ios-arm64/libsecp256k1.a" 2>/dev/null || true
echo ""
echo "Simulator library:"
lipo -info "${XC_OUT}/ios-arm64_x86_64-simulator/libsecp256k1.a" 2>/dev/null || true
echo ""
echo "VERSION: $(cat "${PREBUILT_DIR}/VERSION")"
echo ""
echo "Total size:"
du -sh "${PREBUILT_DIR}"
echo ""
echo "Done! You can now commit the prebuilt directory."
