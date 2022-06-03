import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { LogBox } from 'react-native'

const useDevDebugging = () => {
  const {
    LOGBOX_IGNORED_WARNINGS,
    LOGBOX_DISABLED,
    STORYBOOK_ENABLED,
    REDSCREEN_DISABLED,
    SPLASH_ENABLED
  } = DevDebuggingConfig
  function configure() {
    LogBox.ignoreLogs(LOGBOX_IGNORED_WARNINGS)
    LogBox.ignoreAllLogs(LOGBOX_DISABLED)
    if (DevDebuggingConfig.LOGBOX_DISABLED) {
      console.warn('Logbox warnings are disabled')
    }
    // @ts-ignore
    console.reportErrorsAsExceptions = REDSCREEN_DISABLED
  }

  const isStorybookEnabled = STORYBOOK_ENABLED
  const isSplashEnabled = SPLASH_ENABLED
  return { configure, isStorybookEnabled, isSplashEnabled }
}

export default useDevDebugging
