#include <jni.h>
#include "nitroavalabscryptoOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::nitroavalabscrypto::initialize(vm);
}
