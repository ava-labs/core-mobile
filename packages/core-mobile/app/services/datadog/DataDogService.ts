import { DdSdkReactNative } from '@datadog/mobile-react-native'
import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation'
import Config from 'react-native-config'
import DataDogConfig from 'services/datadog/DataDogConfig'
import Logger from 'utils/Logger'
import { navigationRef } from 'utils/Navigation'

export const DataDogService = {
  init: async () => {
    if (Config.E2E_MNEMONIC) {
      const config = DataDogConfig
      if (config) {
        try {
          await DdSdkReactNative.initialize(config)
        } catch (error) {
          Logger.error('Error initializing Datadog:', error)
        }
      }
    }
  },

  startRumTracking: () => {
    if (navigationRef) {
      DdRumReactNavigationTracking.startTrackingViews(navigationRef.current)
    } else {
      Logger.error(
        'Failed to start RUM tracking: navigationRef is null or undefined'
      )
    }
  }
}

export default DataDogService
