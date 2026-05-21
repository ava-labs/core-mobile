project(NitroAvalabsCrypto)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME NitroAvalabsCrypto)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# ------------------------------------------------------------------------------
# 1. Source Files & Includes
# ------------------------------------------------------------------------------
file(GLOB CPP_SOURCES "../cpp/*.cpp" "../cpp/*.hpp")
add_library(${PACKAGE_NAME} SHARED src/main/cpp/cpp-adapter.cpp ${CPP_SOURCES})

# Add Nitrogen specs
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroAvalabsCrypto+autolinking.cmake)

# Set up local includes
include_directories("src/main/cpp" "../cpp")

# ------------------------------------------------------------------------------
# 2. System Libraries
# ------------------------------------------------------------------------------
find_library(LOG_LIB log)

# ------------------------------------------------------------------------------
# 3. SECP256K1 Configuration (Manual Build)
# ------------------------------------------------------------------------------
message(STATUS "=== SECP256K1 Configuration ===")
message(STATUS "SECP256K1_ANDROID_ROOT: ${SECP256K1_ANDROID_ROOT}")
message(STATUS "ANDROID_ABI: ${ANDROID_ABI}")

if(NOT DEFINED SECP256K1_INCLUDE_DIR OR NOT DEFINED SECP256K1_ANDROID_ROOT)
    message(FATAL_ERROR "SECP256K1 vars not provided. Ensure Gradle passes -DSECP256K1_INCLUDE_DIR and -DSECP256K1_ANDROID_ROOT.")
endif()

set(SECP256K1_LIB_DIR "${SECP256K1_ANDROID_ROOT}/${ANDROID_ABI}/lib")
file(REAL_PATH "${SECP256K1_LIB_DIR}" RESOLVED_LIB_DIR)
message(STATUS "Resolved SECP256K1_LIB_DIR: ${RESOLVED_LIB_DIR}")

set(SECP256K1_LIB "${RESOLVED_LIB_DIR}/libsecp256k1.so")
if(NOT EXISTS "${SECP256K1_LIB}")
    message(FATAL_ERROR "libsecp256k1.so does not exist at ${SECP256K1_LIB}")
endif()

file(SIZE "${SECP256K1_LIB}" LIB_SIZE)
if(LIB_SIZE EQUAL 0)
    message(FATAL_ERROR "libsecp256k1.so is empty at ${SECP256K1_LIB}")
endif()

message(STATUS "✓ Found libsecp256k1.so (${LIB_SIZE} bytes)")
message(STATUS "  Path: ${SECP256K1_LIB}")

include_directories("${SECP256K1_INCLUDE_DIR}")

# ------------------------------------------------------------------------------
# 4. OpenSSL Configuration (Prefab from Gradle) — REQUIRED
# ------------------------------------------------------------------------------
# OpenSSL is a hard requirement: batch-derivation headers (address_derivation.hpp,
 # base58.hpp) include OpenSSL headers unconditionally. Fail the build here
 # rather than letting compilation fail with a cryptic missing-header error later.
message(STATUS "")
message(STATUS "=== OpenSSL Configuration ===")

set(CRYPTO_LIB "")
set(SSL_LIB "")

# Try lowercase package name first (Prefab convention used by io.github.ronickg:openssl)
find_package(openssl QUIET CONFIG)

if(openssl_FOUND AND TARGET openssl::crypto)
    set(CRYPTO_LIB openssl::crypto)
    message(STATUS "✓ openssl::crypto target available (lowercase package)")
    if(TARGET openssl::ssl)
        set(SSL_LIB openssl::ssl)
    endif()
else()
    # Fallback: uppercase OpenSSL package
    find_package(OpenSSL QUIET)
    if(OpenSSL_FOUND AND TARGET OpenSSL::Crypto)
        set(CRYPTO_LIB OpenSSL::Crypto)
        message(STATUS "✓ OpenSSL::Crypto target available (uppercase package)")
        if(TARGET OpenSSL::SSL)
            set(SSL_LIB OpenSSL::SSL)
        endif()
    endif()
endif()

if(NOT CRYPTO_LIB)
    message(FATAL_ERROR
        "OpenSSL is required to build NitroAvalabsCrypto but was not found via Prefab.\n"
        "To fix:\n"
        "  1. Ensure android/build.gradle has:\n"
        "       buildFeatures { prefab true }\n"
        "  2. Ensure dependencies include:\n"
        "       implementation 'io.github.ronickg:openssl:3.6.0-1'\n"
        "  3. Run: cd android && ./gradlew clean build")
endif()

message(STATUS "Crypto library: ${CRYPTO_LIB}")

# ------------------------------------------------------------------------------
# 5. Link Libraries
# ------------------------------------------------------------------------------
target_link_libraries(
    ${PACKAGE_NAME}
    ${LOG_LIB}
    ${SECP256K1_LIB}
    android
)

# Link OpenSSL (required)
target_link_libraries(${PACKAGE_NAME} ${CRYPTO_LIB})
message(STATUS "✓ Linked: ${CRYPTO_LIB}")
if(SSL_LIB)
    target_link_libraries(${PACKAGE_NAME} ${SSL_LIB})
    message(STATUS "✓ Linked: ${SSL_LIB}")
endif()

# ------------------------------------------------------------------------------
# 6. Build Summary
# ------------------------------------------------------------------------------
message(STATUS "")
message(STATUS "=== Build Summary ===")
message(STATUS "Package:      ${PACKAGE_NAME}")
message(STATUS "C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Android ABI:  ${ANDROID_ABI}")
message(STATUS "SECP256K1:    ✓")
message(STATUS "OpenSSL:      ✓ (required)")
message(STATUS "=====================")
