import DevDebuggingConfig from 'utils/debugging/DevDebuggingConfig'
import { LogBox } from 'react-native'

const useDevDebugging = () => {
  const {
    LOGBOX_IGNORED_WARNINGS,
    LOGBOX_DISABLED,
    STORYBOOK_ENABLED,
    REDSCREEN_DISABLED,
    SHOW_DEMO_NFTS
  } = DevDebuggingConfig
  function configure() {
    LogBox.ignoreLogs(LOGBOX_IGNORED_WARNINGS)
    LogBox.ignoreAllLogs(LOGBOX_DISABLED)
    // @ts-ignore
    // eslint-disable-next-line no-console
    console.reportErrorsAsExceptions = REDSCREEN_DISABLED
  }

  const isStorybookEnabled = STORYBOOK_ENABLED
  const showDemoNFTS = SHOW_DEMO_NFTS
  return { configure, isStorybookEnabled, showDemoNFTS }
}

export default useDevDebugging
