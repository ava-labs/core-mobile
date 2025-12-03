#!/usr/bin/env bash
set -euo pipefail

# ------------------- Configuration -------------------
SECP_REPO_URL=${SECP_REPO_URL:-"https://github.com/bitcoin-core/secp256k1.git"}
SECP_TAG=${SECP_TAG:-"v0.7.0"}
MODULE_FLAGS=${SECP_MODULES:-"--enable-module-extrakeys --enable-module-schnorrsig"}

ROOT_DIR="${PODS_TARGET_SRCROOT:-${SRCROOT:-$(pwd)}}"
IOS_DIR="${ROOT_DIR}/ios"
WORK_DIR="${IOS_DIR}/secp256k1-src"
BUILD_DIR="${IOS_DIR}/secp-build"
OUT_DIR="${IOS_DIR}/secp-out"
XC_OUT="${OUT_DIR}/secp256k1.xcframework"

# Detect SDK (Xcode env)
if [[ "${SDK_NAME:-}" == iphonesimulator* || "${EFFECTIVE_PLATFORM_NAME:-}" == "-iphonesimulator" ]]; then
  BUILD_TARGET="iphonesimulator"
else
  BUILD_TARGET="iphoneos"
fi
STAMP_FILE="${OUT_DIR}/.last_target"

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

# ------------------- Fast-path cache -------------------
if [[ -d "${XC_OUT}" ]] && [[ -f "${STAMP_FILE}" ]] && grep -q "^${BUILD_TARGET}$" "${STAMP_FILE}"; then
  echo "[secp] Using cached ${XC_OUT} for ${BUILD_TARGET}"
  exit 0
fi
if [[ -d "${XC_OUT}" ]] && [[ -f "${STAMP_FILE}" ]] && ! grep -q "^${BUILD_TARGET}$" "${STAMP_FILE}"; then
  echo "[secp] Target changed – rebuilding"
  rm -rf "${XC_OUT}"
fi

mkdir -p "${WORK_DIR}" "${BUILD_DIR}" "${OUT_DIR}"

# ------------------- Clone / update -------------------
if [[ ! -d "${WORK_DIR}/.git" ]]; then
  echo "[secp] Cloning ${SECP_REPO_URL}@${SECP_TAG}..."
  git clone --depth 1 --branch "${SECP_TAG}" "${SECP_REPO_URL}" "${WORK_DIR}"
else
  echo "[secp] Updating repo..."
  git -C "${WORK_DIR}" fetch --tags
  git -C "${WORK_DIR}" checkout "${SECP_TAG}"
  git -C "${WORK_DIR}" reset --hard "${SECP_TAG}"
fi

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
  find "${WORK_DIR}" -name "*.o" -o -name "*.lo" -o -name "*.la" -o -name "*.a" -delete
  rm -rf "${WORK_DIR}/.libs"

  # ---- SDK / compiler ----
  local SDKROOT=$(xcrun --sdk "${sdk}" --show-sdk-path)
  local CC=$(xcrun --sdk "${sdk}" -f clang)
  local CXX=$(xcrun --sdk "${sdk}" -f clang++)

  # ---- Flags (identical for all slices) ----
  local ARCH_FLAG="-arch ${arch}"
  local MIN_VERSION
  if [[ "${sdk}" == "iphonesimulator" ]]; then
    MIN_VERSION="-mios-simulator-version-min=${IPHONEOS_DEPLOYMENT_TARGET:-12.0}"
    local TARGET_FLAG="-target ${arch}-apple-ios${IPHONEOS_DEPLOYMENT_TARGET:-12.0}-simulator"
  else
    MIN_VERSION="-miphoneos-version-min=${IPHONEOS_DEPLOYMENT_TARGET:-12.0}"
    local TARGET_FLAG=""
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
  fi
}

# ------------------- Build slices -------------------
build_one iphoneos arm64 aarch64-apple-darwin

HOST_ARCH="$(uname -m)"
if [[ "$HOST_ARCH" == "arm64" ]]; then
  build_one iphonesimulator arm64 aarch64-apple-darwin
elif [[ "$HOST_ARCH" == "x86_64" ]]; then
  build_one iphonesimulator x86_64 x86_64-apple-darwin
else
  echo "[secp] WARNING: unknown host arch $HOST_ARCH – no simulator slice"
fi

# ------------------- Copy headers (once) -------------------
rm -rf "${OUT_DIR}/include"
for inc in \
  "${BUILD_DIR}/iphoneos-arm64/include" \
  "${BUILD_DIR}/iphonesimulator-arm64/include" \
  "${BUILD_DIR}/iphonesimulator-x86_64/include"; do
  [[ -d "$inc" ]] && cp -R "$inc" "${OUT_DIR}/include" && break
done

# ------------------- Create XCFramework -------------------
echo "[secp] Creating XCFramework..."
rm -rf "${XC_OUT}"

DEV_LIB="${BUILD_DIR}/iphoneos-arm64/lib/libsecp256k1.a"
SIM_ARM64_LIB="${BUILD_DIR}/iphonesimulator-arm64/lib/libsecp256k1.a"
SIM_X64_LIB="${BUILD_DIR}/iphonesimulator-x86_64/lib/libsecp256k1.a"

XC_ARGS=()
[[ -f "${DEV_LIB}" ]] && XC_ARGS+=( -library "${DEV_LIB}" -headers "${OUT_DIR}/include" )
[[ -f "${SIM_ARM64_LIB}" ]] && XC_ARGS+=( -library "${SIM_ARM64_LIB}" -headers "${OUT_DIR}/include" )
[[ -f "${SIM_X64_LIB}" ]] && XC_ARGS+=( -library "${SIM_X64_LIB}" -headers "${OUT_DIR}/include" )

if [[ ${#XC_ARGS[@]} -eq 0 ]]; then
  echo "[secp] No libraries to package!"
  exit 1
fi

xcodebuild -create-xcframework \
  "${XC_ARGS[@]}" \
  -output "${XC_OUT}" || {
    echo "[secp] Failed to create XCFramework"
    exit 1
  }

echo "[secp] XCFramework created: ${XC_OUT}"
echo "${BUILD_TARGET}" > "${STAMP_FILE}"