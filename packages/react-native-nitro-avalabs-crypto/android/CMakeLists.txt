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
# 4. OpenSSL Configuration (Prefab from Gradle)
# ------------------------------------------------------------------------------
message(STATUS "")
message(STATUS "=== OpenSSL Configuration ===")

set(OPENSSL_FOUND FALSE)
set(CRYPTO_LIB "")

# Try to find openssl package via Prefab (lowercase package name)
find_package(openssl QUIET CONFIG)

if(openssl_FOUND)
    message(STATUS "✓ openssl package found via Prefab")
    
    # Check for crypto target (required for Ed25519)
    if(TARGET openssl::crypto)
        set(CRYPTO_LIB openssl::crypto)
        set(OPENSSL_FOUND TRUE)
        message(STATUS "  ✓ openssl::crypto target available")
    else()
        message(WARNING "  ✗ openssl::crypto target not found")
    endif()
    
    # Check for ssl target (optional, not needed for Ed25519)
    if(TARGET openssl::ssl)
        set(SSL_LIB openssl::ssl)
        message(STATUS "  ✓ openssl::ssl target available")
    endif()
else()
    # Fallback: Try uppercase OpenSSL package
    message(STATUS "Trying uppercase OpenSSL package...")
    find_package(OpenSSL QUIET)
    
    if(OpenSSL_FOUND)
        message(STATUS "✓ OpenSSL package found via Prefab")
        
        if(TARGET OpenSSL::Crypto)
            set(CRYPTO_LIB OpenSSL::Crypto)
            set(OPENSSL_FOUND TRUE)
            message(STATUS "  ✓ OpenSSL::Crypto target available")
        endif()
        
        if(TARGET OpenSSL::SSL)
            set(SSL_LIB OpenSSL::SSL)
            message(STATUS "  ✓ OpenSSL::SSL target available")
        endif()
    else()
        message(WARNING "✗ OpenSSL NOT found via Prefab")
    endif()
endif()

# Status summary
message(STATUS "")
if(OPENSSL_FOUND)
    message(STATUS "=== OpenSSL Status: ENABLED ✓ ===")
    message(STATUS "Crypto library: ${CRYPTO_LIB}")
    message(STATUS "Ed25519 getExtendedPublicKey: Native (fast)")
    message(STATUS "=================================")
else()
    message(WARNING "=== OpenSSL Status: DISABLED ✗ ===")
    message(WARNING "Ed25519 getExtendedPublicKey: JS fallback")
    message(WARNING "")
    message(WARNING "To enable native Ed25519 support:")
    message(WARNING "  1. Ensure android/build.gradle has:")
    message(WARNING "     buildFeatures { prefab true }")
    message(WARNING "  2. Ensure dependencies include:")
    message(WARNING "     implementation 'com.android.ndk.thirdparty:openssl:1.1.1q-beta-1'")
    message(WARNING "  3. Run: cd android && ./gradlew clean build")
    message(WARNING "==================================")
    
    # Add compile definition so C++ code knows OpenSSL is unavailable
    target_compile_definitions(${PACKAGE_NAME} PRIVATE OPENSSL_NOT_AVAILABLE)
endif()

# ------------------------------------------------------------------------------
# 5. Link Libraries
# ------------------------------------------------------------------------------
target_link_libraries(
    ${PACKAGE_NAME}
    ${LOG_LIB}
    ${SECP256K1_LIB}
    android
)

# Link OpenSSL if found
if(OPENSSL_FOUND AND CRYPTO_LIB)
    target_link_libraries(${PACKAGE_NAME} ${CRYPTO_LIB})
    message(STATUS "✓ Linked: ${CRYPTO_LIB}")
    
    # Optionally link SSL if available (not required for Ed25519)
    if(SSL_LIB)
        target_link_libraries(${PACKAGE_NAME} ${SSL_LIB})
        message(STATUS "✓ Linked: ${SSL_LIB}")
    endif()
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
if(OPENSSL_FOUND)
    message(STATUS "OpenSSL:      ✓ (Ed25519 native)")
else()
    message(STATUS "OpenSSL:      ✗ (Ed25519 JS fallback)")
endif()
message(STATUS "=====================")