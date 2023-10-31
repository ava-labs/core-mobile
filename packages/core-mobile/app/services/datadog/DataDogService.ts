import { DdSdkReactNative } from '@datadog/mobile-react-native'
import DataDogConfig from 'utils/DataDogConfig'

const DataDogService = {
  init: async () => {
    if (process.env.E2E_MNEMONIC) {
      const config = DataDogConfig
      if (config) {
        try {
          await DdSdkReactNative.initialize(config)
        } catch (error) {
          // eslint-disable no-empty
        }
      }
    }
  }
}

export default DataDogService
