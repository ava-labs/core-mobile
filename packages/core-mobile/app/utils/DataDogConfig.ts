import Config from 'react-native-config'
import { DdSdkReactNativeConfiguration } from '@datadog/mobile-react-native'

let DataDogConfig: DdSdkReactNativeConfiguration | null = null

if (
    Config.DD_CLIENT_TOKEN &&
    Config.ENVIRONMENT &&
    Config.DD_APPLICATION_ID &&
    Config.DD_SITE &&
    Config.BUILD_NUMBER) {
  DataDogConfig = new DdSdkReactNativeConfiguration(
    Config.DD_CLIENT_TOKEN,
    Config.ENVIRONMENT,
    Config.DD_APPLICATION_ID,
    true,
    true,
    true
  )

  DataDogConfig.site = Config.DD_SITE
  DataDogConfig.nativeCrashReportEnabled = true
  DataDogConfig.nativeViewTracking = true
  DataDogConfig.sessionSamplingRate = 80
  DataDogConfig.resourceTracingSamplingRate = 80
  DataDogConfig.version = Config.BUILD_NUMBER
}

export default DataDogConfig
