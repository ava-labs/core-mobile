/** @type {Detox.DetoxConfig} */

module.exports = {
  testRunner: {
    $0: 'jest',
    args: {
      config: 'e2e/config.json'
    }
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34'
      }
    },
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16 Pro',
        os: 'iOS 18.2'
      }
    },
    emulator_ci: {
      type: 'android.emulator',
      device: {
        avdName: 'emulator-5554'
      }
    },
    android_real_device: {
      type: 'android.attached',
      device: {
        // Run 'adb devices' in terminal to get the device name and replace it here
        adbName: '0A281FDD4001KZ'
      }
    }
  },

  apps: {
    'ios.internal.debug': {
      type: 'ios.app',
      binaryPath:
        'ios/DerivedData/Build/Products/Debug-iphonesimulator/AvaxWallet.app'
    },
    'ios.internal.release': {
      type: 'ios.app',
      binaryPath: 'binaries/AvaxWalletInternal.app'
    },
    'ios.internal.release.ci': {
      type: 'ios.app',
      binaryPath: process.env.BITRISE_APP_DIR_PATH
    },
    'ios.external.release.ci': {
      type: 'ios.app',
      binaryPath: process.env.BITRISE_APP_DIR_PATH
    },
    'android.internal.debug': {
      type: 'android.apk',
      binaryPath:
        'android/app/build/outputs/apk/internal/debug/app-internal-debug.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/internal/debug/app-internal-debug-androidTest.apk'
    },
    'android.internal.release.ci': {
      type: 'android.apk',
      binaryPath: process.env.BITRISE_APK_PATH,
      testBinaryPath: process.env.BITRISE_TEST_APK_PATH
    },
    'android.external.release.ci': {
      type: 'android.apk',
      binaryPath: process.env.BITRISE_APK_PATH,
      testBinaryPath: process.env.BITRISE_TEST_APK_PATH
    },
    'android.internal.e2e': {
      type: 'android.apk',
      binaryPath:
        'android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/internal/debug/app-internal-e2e-androidTest.apk'
    },
    'android.external.e2e.old_version': {
      type: 'android.apk',
      binaryPath:
        './e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk',
      testBinaryPath:
        './e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk'
    }
  },
  artifacts: {
    rootDir: './artifacts',
    plugins: {
      instruments: { enabled: false },
      log: { enabled: true },
      uiHierarchy: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true
      },
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
        takeWhen: {
          testStart: false,
          testDone: true
        },
        enabled: true
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
        android: {
          bitRate: 4000000
        },
        simulator: {
          codec: 'hevc'
        }
      }
    }
  },
  configurations: {
    'ios.internal.debug': {
      device: 'simulator',
      app: 'ios.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/reuseStateConfig.json'
        },
        jest: {
          setupTimeout: 300000,
          testTimeout: 300000
        }
      }
    },
    'ios.internal.debug.reuse_state': {
      device: 'simulator',
      app: 'ios.internal.debug',
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/reuseStateConfig.json'
        }
      },
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      }
    },
    'ios.internal.smoke.debug.reuse_state': {
      device: 'simulator',
      app: 'ios.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: 'e2e/configs/smokeTestConfigReuseState.json'
        }
      }
    },
    'ios.internal.smoke.debug': {
      device: 'simulator',
      app: 'ios.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfig.json'
        }
      }
    },
    'ios.internal.release.ci': {
      device: 'simulator',
      app: 'ios.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      }
    },
    'ios.internal.release.regression.ci': {
      device: 'simulator',
      app: 'ios.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json'
        }
      }
    },
    'ios.internal.release.dapp.ci': {
      device: 'simulator',
      app: 'ios.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/dappTestConfig.json'
        }
      }
    },
    'ios.internal.release.bridge.ci': {
      device: 'simulator',
      app: 'ios.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/bridgeTestConfig.json'
        }
      }
    },
    'ios.internal.release.smoke.ci': {
      device: 'simulator',
      app: 'ios.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: 'e2e/configs/smokeTestConfig.json'
        }
      }
    },
    'ios.internal.release.smoke.ci.reuse_state': {
      device: 'simulator',
      app: 'ios.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfigReuseState.json'
        }
      }
    },
    'ios.external.release.ci': {
      device: 'simulator',
      app: 'ios.external.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json'
        }
      }
    },
    'ios.external.release.smoke.ci': {
      device: 'simulator',
      app: 'ios.external.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/ios',
        plugins: {
          instruments: 'all'
        }
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json'
        }
      }
    },
    'android.internal.debug': {
      device: 'emulator',
      app: 'android.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/reuseStateConfig.json'
        },
        jest: {
          setupTimeout: 300000,
          testTimeout: 300000
        }
      }
    },
    'android.internal.debug.reuse_state': {
      device: 'emulator',
      app: 'android.internal.debug',
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/reuse_state_config.json'
        }
      },
      artifacts: {
        rootDir: './e2e/artifacts/android'
      }
    },
    'android.internal.smoke.debug.reuse_state': {
      device: 'emulator',
      app: 'android.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfigReuseState.json'
        }
      }
    },
    'android.internal.smoke.debug.no_reuse_state': {
      device: 'emulator',
      app: 'android.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfig.json'
        }
      }
    },
    'android.internal.smoke.debug.real_device': {
      device: 'android_real_device',
      app: 'android.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfigReuseState.json'
        }
      }
    },
    'android.internal.smoke.debug.no_reuse_state.real_device': {
      device: 'android_real_device',
      app: 'android.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/reuseStateConfig.json'
        }
      }
    },
    'android.internal.release.smoke.reuse_state.ci': {
      device: 'emulator_ci',
      app: 'android.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfigReuseState.json',
          _: [process.env.TESTS_TO_RUN]
        }
      }
    },
    'android.internal.release.smoke.ci': {
      device: 'emulator_ci',
      app: 'android.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfig.json',
          _: [process.env.TESTS_TO_RUN]
        }
      }
    },
    'android.internal.release.regression.ci': {
      device: 'emulator_ci',
      app: 'android.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json',
          _: [process.env.TESTS_TO_RUN]
        }
      }
    },
    'android.internal.release.regression.parameterized_tests.ci': {
      device: 'emulator_ci',
      app: 'android.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionParameterizedTestsConfig.json'
        }
      }
    },
    'android.internal.release.ci': {
      device: 'emulator_ci',
      app: 'android.internal.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      }
    },
    'android.external.release.ci': {
      device: 'emulator_ci',
      app: 'android.external.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json',
          _: [process.env.TESTS_TO_RUN]
        }
      }
    },
    'android.external.release.smoke.ci': {
      device: 'emulator_ci',
      app: 'android.external.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/smokeTestConfig.json'
        }
      }
    },
    'android.external.release.regression.ci': {
      device: 'emulator_ci',
      app: 'android.external.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json',
          _: [process.env.TESTS_TO_RUN]
        }
      }
    },
    'android.external.release.regression.parameterized_tests.ci': {
      device: 'emulator_ci',
      app: 'android.external.release.ci',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionParameterizedTestsConfig.json'
        }
      }
    },
    'android.internal.e2e': {
      device: 'emulator',
      app: 'android.internal.e2e'
    },
    'android.external.e2e.old_version': {
      device: 'emulator',
      app: 'android.external.e2e.old_version',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      },
      testRunner: {
        $0: 'jest',
        args: {
          config: './e2e/configs/regressionConfig.json'
        }
      }
    }
  }
}
