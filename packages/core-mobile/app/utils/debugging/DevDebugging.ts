import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { LogBox } from 'react-native'
import { ReduceMotion } from 'react-native-reanimated'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const useDevDebugging = () => {
  const {
    LOGBOX_IGNORED_WARNINGS,
    LOGBOX_DISABLED,
    STORYBOOK_ENABLED,
    REDSCREEN_DISABLED,
    SHOW_DEMO_NFTS
  } = DevDebuggingConfig
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function configure() {
    LogBox.ignoreLogs(LOGBOX_IGNORED_WARNINGS)
    LogBox.ignoreAllLogs(LOGBOX_DISABLED)
    // @ts-ignore
    // eslint-disable-next-line no-console
    console.reportErrorsAsExceptions = REDSCREEN_DISABLED
  }

  const isStorybookEnabled = STORYBOOK_ENABLED
  const showDemoNFTS = SHOW_DEMO_NFTS
  ReduceMotion.Always
  return { configure, isStorybookEnabled, showDemoNFTS }
}

export default useDevDebugging
