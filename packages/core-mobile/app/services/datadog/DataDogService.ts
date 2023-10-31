import Config from 'react-native-config'
import { DdSdkReactNative } from '@datadog/mobile-react-native'
import DataDogConfig from 'utils/DataDogConfig'

const DataDogService = {
    init: async () => {
        if (Config.ENVIRONMENT !== 'production') {
            const config = DataDogConfig
            if (config) {
                try {
                    await DdSdkReactNative.initialize(config)
                    console.log('DataDog Initiated')
                } catch (error) {
                    console.error('Error initializing Datadog:', error)
                }
            }
        }
    }
};

export default DataDogService
