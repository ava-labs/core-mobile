import { DdSdkReactNative } from '@datadog/mobile-react-native'
import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation'
import Config from 'react-native-config'
import DataDogConfig from 'services/datadog/DataDogConfig'
import Logger from 'utils/Logger'
import { navigationRef } from 'utils/Navigation'

export const DataDogService = {
  init: async () => {
    let result
    if (Config.E2E_MNEMONIC) {
      const config = DataDogConfig
      if (config) {
        try {
          await DdSdkReactNative.initialize(config)
          result = true
        } catch (error) {
          Logger.error('Error initializing Datadog:', error)
          result = false
        }
      }
    }
    if (result) {
      DataDogService.startRumTracking()
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
