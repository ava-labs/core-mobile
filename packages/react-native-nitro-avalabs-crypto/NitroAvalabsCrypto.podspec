require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NitroAvalabsCrypto"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported, :visionos => 1.0 }
  s.source       = { :git => "https://github.com/mrousavy/nitro.git", :tag => "#{s.version}" }

  s.source_files = [
    # Implementation (Swift)
    "ios/**/*.{swift}",
    # Autolinking/Registration (Objective-C++)
    "ios/**/*.{m,mm}",
    # Implementation (C++ objects)
    "cpp/**/*.{hpp,cpp}",
  ]

  s.dependency 'React-jsi'
  s.dependency 'React-callinvoker'
  s.dependency 'OpenSSL-Universal', '1.1.1100'

  load 'nitrogen/generated/ios/NitroAvalabsCrypto+autolinking.rb'
  add_nitrogen_files(s)


    # -----------------------------------------------------------------
  # Build script – produces secp256k1.xcframework
  # -----------------------------------------------------------------
  s.script_phases = [{
    :name => 'Build secp256k1 (cached)',
    :execution_position => :before_compile,
    :shell_path => '/bin/bash',
    :script => %Q{bash "${PODS_TARGET_SRCROOT}/ios/scripts/build.sh"}
  }]

  # -----------------------------------------------------------------
  # Use the XCFramework – **no manual paths or -lsecp256k1**
  # -----------------------------------------------------------------
  s.vendored_frameworks = '$(PODS_TARGET_SRCROOT)/ios/secp-out/secp256k1.xcframework'

  # Keep your C++/Swift flags (they are harmless)
  s.pod_target_xcconfig = {
    'HEADER_SEARCH_PATHS' => '$(inherited) $(PODS_TARGET_SRCROOT)/ios/secp-out/include',
    'CLANG_CXX_LIBRARY'               => 'libc++',
    'OTHER_CPLUSPLUSFLAGS'            => '$(inherited) -std=gnu++20',
    'CLANG_CXX_LANGUAGE_STANDARD'     => 'c++20',
    'SWIFT_OBJC_INTEROP_MODE'         => 'objcxx',
    'DEFINES_MODULE'                  => 'YES',
    'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES' => 'YES'
  }

  # Tell Xcode where the public headers live
  s.xcconfig = {
   'HEADER_SEARCH_PATHS' => '$(inherited) $(PODS_TARGET_SRCROOT)/ios/secp-out/include',
  }

  s.user_target_xcconfig = {
      'LIBRARY_SEARCH_PATHS[sdk=iphoneos*]' => '$(inherited) "$(PODS_ROOT)/../../node_modules/react-native-nitro-avalabs-crypto/ios/secp-build/iphoneos-arm64/lib"',
    'LIBRARY_SEARCH_PATHS[sdk=iphonesimulator*]' => '$(inherited) "$(PODS_ROOT)/../../node_modules/react-native-nitro-avalabs-crypto/ios/secp-build/iphonesimulator-arm64/lib"',
    'OTHER_LDFLAGS' => '$(inherited) -lsecp256k1 -lcrypto -lssl'
}

  install_modules_dependencies(s)
end
