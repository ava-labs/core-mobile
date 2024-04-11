/** @type {Detox.DetoxConfig} */

const getApkPaths = () => {
  if (process.env.BITRISE_SIGNED_APK_PATH_LIST) {
    const apks = process.env.BITRISE_SIGNED_APK_PATH_LIST.split('|')
    return [apks[0], apks[1]]
  }

  return [undefined, undefined]
}

const [ANDROID_APK_PATH, ANDROID_TEST_APK_PATH] = getApkPaths()

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
        avdName: 'Pixel_3_API_30'
      }
    },
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15 Pro' }
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
        adbName: 'R5CN709H42E'
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
      binaryPath: ANDROID_APK_PATH,
      testBinaryPath: ANDROID_TEST_APK_PATH
    },
    'android.internal.e2e': {
      type: 'android.apk',
      binaryPath:
        'android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/internal/debug/app-internal-e2e-androidTest.apk'
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
          config: 'e2e/reuse_state_config.json'
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
          config: 'e2e/reuse_state_config.json'
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
          config: 'e2e/smoke_test_config_reuse_state.json'
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
          config: 'e2e/smoke_test_config.json'
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
          config: 'e2e/smoke_test_config.json'
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
          config: 'e2e/smoke_test_config_reuse_state.json'
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
          config: './e2e/smoke_test_config.json'
        }
      }
    },
    'android.internal.debug': {
      device: 'emulator',
      app: 'android.internal.debug',
      artifacts: {
        rootDir: './e2e/artifacts/android'
      }
    },
    'android.internal.debug.reuse_state': {
      device: 'emulator',
      app: 'android.internal.debug',
      testRunner: {
        $0: 'jest',
        args: {
          config: 'e2e/reuse_state_config.json'
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
          config: 'e2e/smoke_test_config_reuse_state.json'
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
          config: 'e2e/smoke_test_config.json'
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
          config: 'e2e/smoke_test_config_reuse_state.json'
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
          config: 'e2e/smoke_test_config_no_reuse_state.json'
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
          config: './e2e/smoke_test_config_reuse_state.json',
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
          config: 'e2e/smoke_test_config.json'
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
          config: 'e2e/smoke_test_config.json'
        }
      }
    },
    'android.internal.e2e': {
      device: 'emulator',
      app: 'android.internal.e2e'
    }
  }
}
