# Keep all native methods and their declaring classes
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep NitroAvalabsCrypto native library loader
-keep class com.margelo.nitro.nitroavalabscrypto.NitroAvalabsCryptoOnLoad {
    public static void initializeNative();
}

# Keep the package class
-keep class com.margelo.nitro.nitroavalabscrypto.NitroAvalabsCryptoPackage {
    public <init>();
    public <methods>;
}

# Keep all Nitro modules infrastructure
-keep class com.margelo.nitro.** { *; }

# Keep secp256k1 related classes if any
-keep class ** implements com.margelo.nitro.core.HybridObject { *; }

# Preserve line numbers for debugging crashes
-keepattributes SourceFile,LineNumberTable

# Keep generic signature for reflection
-keepattributes Signature

# Keep annotations
-keepattributes *Annotation*

# Don't warn about missing classes from other modules
-dontwarn com.margelo.nitro.**
