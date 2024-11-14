# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# https://github.com/react-native-svg/react-native-svg/issues/1061
-keep public class com.horcrux.svg.** { *; }

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# react-native-config
-keep class com.avaxwallet.BuildConfig { *; }

# https://github.com/oblador/react-native-keychain#proguard-rules
-keep class com.facebook.crypto.** { *; }

# https://github.com/proyecto26/react-native-inappbrowser#android
-keepattributes *Annotation*
-keepclassmembers class ** {
  @org.greenrobot.eventbus.Subscribe <methods>;
}

# react-native-fast-image
-keep enum org.greenrobot.eventbus.ThreadMode { *; }
-keep public class com.dylanvann.fastimage.* {*;}
-keep public class com.dylanvann.fastimage.** {*;}
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}

# react-native-skia
-keep class com.shopify.reactnative.skia.** { *; }