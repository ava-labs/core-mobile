import {
  DatadogProviderConfiguration,
  SdkVerbosity,
  TrackingConsent
} from '@datadog/mobile-react-native'
import DeviceInfo from 'react-native-device-info'

export const DataDogConfig = new DatadogProviderConfiguration(
  'pubddf90c8e62e38e3807cfe18bb800f7ab',
  'production',
  '59d44517-638e-43f0-9dbc-c09cd3296db7',
  true,
  true,
  true,
  TrackingConsent.GRANTED
)
DataDogConfig.site = 'US1'
DataDogConfig.verbosity = SdkVerbosity.DEBUG
DataDogConfig.nativeCrashReportEnabled = true
DataDogConfig.nativeViewTracking = true
DataDogConfig.nativeInteractionTracking = true
DataDogConfig.sessionSamplingRate = 100
DataDogConfig.resourceTracingSamplingRate = 80
DataDogConfig.version = DeviceInfo.getBuildNumber()
