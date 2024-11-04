import {
  DdSdkReactNativeConfiguration,
  TrackingConsent
} from '@datadog/mobile-react-native'
import Config from 'react-native-config'
import DeviceInfo from 'react-native-device-info'

let DataDogConfig: DdSdkReactNativeConfiguration | null = null

if (
  Config.DD_CLIENT_TOKEN &&
  Config.ENVIRONMENT &&
  Config.DD_APPLICATION_ID &&
  Config.DD_SITE &&
  process.env.CI
) {
  DataDogConfig = new DdSdkReactNativeConfiguration(
    Config.DD_CLIENT_TOKEN,
    Config.ENVIRONMENT,
    Config.DD_APPLICATION_ID,
    true,
    true,
    true,
    TrackingConsent.GRANTED
  )

  DataDogConfig.site = Config.DD_SITE
  DataDogConfig.nativeCrashReportEnabled = true
  DataDogConfig.nativeViewTracking = true
  DataDogConfig.sessionSamplingRate = 100
  DataDogConfig.resourceTracingSamplingRate = 100
  DataDogConfig.version = DeviceInfo.getBuildNumber()
}

export default DataDogConfig
