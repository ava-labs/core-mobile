project(nitroavalabscrypto)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME nitroavalabscrypto)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 20)

# Define C++ library and add all sources
file(GLOB CPP_SOURCES "../cpp/*.cpp" "../cpp/*.hpp")
add_library(${PACKAGE_NAME} SHARED src/main/cpp/cpp-adapter.cpp ${CPP_SOURCES})

# Add Nitrogen specs
include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/nitroavalabscrypto+autolinking.cmake)

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

# Link all libraries together
target_link_libraries(
    ${PACKAGE_NAME}
    ${LOG_LIB}
    ${SECP256K1_LIB}
    android
)