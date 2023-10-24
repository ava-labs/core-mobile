export enum Platform {
  Android = 'android',
  iOS = 'ios'
}

export default {
  idleTimeoutError:
    'Test Failed: Wait for [com.wix.detox.reactnative.idlingresources.AnimatedModuleIdlingResource] to become idle timed out',
  animatedConsoleError: 'Error: AnimatedModuleIdlingResource timeout'
}
