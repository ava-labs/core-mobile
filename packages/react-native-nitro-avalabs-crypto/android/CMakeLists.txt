project(NitroAvalabsCrypto)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME NitroAvalabsCrypto)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
file(GLOB CPP_SOURCES "../cpp/*.cpp" "../cpp/*.hpp")
add_library(${PACKAGE_NAME} SHARED src/main/cpp/cpp-adapter.cpp ${CPP_SOURCES})

# Add Nitrogen specs
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroAvalabsCrypto+autolinking.cmake)

# Set up local includes
include_directories("src/main/cpp" "../cpp")

# Debug variables
message("SECP256K1_ANDROID_ROOT: ${SECP256K1_ANDROID_ROOT}")
message("ANDROID_ABI: ${ANDROID_ABI}")
message("SECP256K1_LIB_DIR: ${SECP256K1_ANDROID_ROOT}/${ANDROID_ABI}/lib")
file(GLOB LIB_FILES "${SECP256K1_ANDROID_ROOT}/${ANDROID_ABI}/lib/*")
message("Files in SECP256K1_LIB_DIR: ${LIB_FILES}")

# Check for secp256k1 variables
if(NOT DEFINED SECP256K1_INCLUDE_DIR OR NOT DEFINED SECP256K1_ANDROID_ROOT)
    message(FATAL_ERROR "SECP256K1 vars not provided. Ensure Gradle passes -DSECP256K1_INCLUDE_DIR and -DSECP256K1_ANDROID_ROOT.")
endif()

# Set the library path directly
set(SECP256K1_LIB_DIR "${SECP256K1_ANDROID_ROOT}/${ANDROID_ABI}/lib")
file(REAL_PATH "${SECP256K1_LIB_DIR}" RESOLVED_LIB_DIR)
message("Resolved SECP256K1_LIB_DIR: ${RESOLVED_LIB_DIR}")
set(SECP256K1_LIB "${RESOLVED_LIB_DIR}/libsecp256k1.so")
if(NOT EXISTS "${SECP256K1_LIB}")
    message(FATAL_ERROR "libsecp256k1.so does not exist at ${SECP256K1_LIB}")
else()
    file(SIZE "${SECP256K1_LIB}" LIB_SIZE)
    message("libsecp256k1.so size: ${LIB_SIZE} bytes")
    if(LIB_SIZE EQUAL 0)
        message(FATAL_ERROR "libsecp256k1.so is empty at ${SECP256K1_LIB}")
    endif()
    message("Manually set libsecp256k1.so at: ${SECP256K1_LIB}")
endif()

# Add headers for secp256k1
include_directories("${SECP256K1_INCLUDE_DIR}")

find_library(LOG_LIB log)

# Find OpenSSL libraries (used for Ed25519 getExtendedPublicKey)
# OpenSSL is provided by react-native-quick-crypto, but may not be findable via find_library
# Try prefab first, then find_library, but make it optional
set(OPENSSL_FOUND FALSE)
set(CRYPTO_LIB "")
set(SSL_LIB "")

# Try prefab (if react-native-quick-crypto provides it)
find_package(OpenSSL QUIET)
if(OpenSSL_FOUND)
    message(STATUS "Found OpenSSL via prefab")
    set(CRYPTO_LIB OpenSSL::crypto)
    set(SSL_LIB OpenSSL::ssl)
    set(OPENSSL_FOUND TRUE)
else()
    # Fallback to find_library
    find_library(CRYPTO_LIB crypto)
    find_library(SSL_LIB ssl)
    if(CRYPTO_LIB AND SSL_LIB)
        message(STATUS "Found OpenSSL via find_library")
        set(OPENSSL_FOUND TRUE)
    else()
        message(WARNING "OpenSSL libraries not found. Ed25519 getExtendedPublicKey will throw at runtime.")
        message(WARNING "  CRYPTO_LIB: ${CRYPTO_LIB}")
        message(WARNING "  SSL_LIB: ${SSL_LIB}")
        # Set to empty strings to avoid CMake errors
        set(CRYPTO_LIB "")
        set(SSL_LIB "")
    endif()
endif()

# Link all libraries together
target_link_libraries(
    ${PACKAGE_NAME}
    ${LOG_LIB}
    ${SECP256K1_LIB}
    android
)

# Conditionally link OpenSSL if found
if(OPENSSL_FOUND AND CRYPTO_LIB AND SSL_LIB)
    target_link_libraries(${PACKAGE_NAME} ${CRYPTO_LIB} ${SSL_LIB})
    # Add OpenSSL include directories if using prefab
    if(TARGET OpenSSL::crypto)
        # Using prefab - includes are handled automatically
        message(STATUS "OpenSSL linked successfully via prefab")
    else()
        # Using find_library - may need to add include paths manually
        # Try to find OpenSSL headers (they might be in system paths)
        message(STATUS "OpenSSL linked successfully via find_library")
    endif()
else()
    message(WARNING "OpenSSL not linked - getExtendedPublicKey will fail at runtime")
    message(WARNING "  The JavaScript patch will use react-native-quick-crypto as fallback.")
    # Add a compile-time define so the code knows OpenSSL is not available
    target_compile_definitions(${PACKAGE_NAME} PRIVATE OPENSSL_NOT_AVAILABLE)
endif()