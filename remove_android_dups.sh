#!/bin/bash

# This script is used to remove duplicate v8 files from the android build

# Use this script when you run into the following error: Duplicate files copied in APK lib/armeabi-v7a/libv8.so

echo 'Deleting duplicate v8 files from android build...'

if [ -d "/node_modules/react-native-v8/android/build/jniLibs/v8/jni/armeabi-v7a" ]; then 
    echo 'Deleting armeabi-v7a'
    rm -rf /node_modules/react-native-v8/android/build/jniLibs/v8/jni/armeabi-v7a
else 
    echo 'armeabi-v7a does not exist'
fi

if [ -d "/node_modules/react-native-v8/android/build/jniLibs/v8/jni/x86" ]; then
    echo 'Deleting x86'
    rm -rf /node_modules/react-native-v8/android/build/jniLibs/v8/jni/x86
else 
    echo 'x86 does not exist'
fi

if [ -d "/node_modules/react-native-v8/android/build/jniLibs/v8/jni/x86_64" ]; then
    echo 'Deleting x86_64'
    rm -rf /node_modules/react-native-v8/android/build/jniLibs/v8/jni/x86_64
else 
    echo 'x86_64 does not exist'
fi