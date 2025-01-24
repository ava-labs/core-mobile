import {
  TrackingConsent,
  DatadogProviderConfiguration,
  SdkVerbosity,
  InitializationMode,
  BatchSize
} from '@datadog/mobile-react-native'
import DeviceInfo from 'react-native-device-info'

import {
  APPLICATION_ID,
  CLIENT_TOKEN,
  ENVIRONMENT,
  SITE
} from './ddCredentials'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getDatadogConfig() {
  const DataDogConfig = new DatadogProviderConfiguration(
    CLIENT_TOKEN,
    ENVIRONMENT,
    APPLICATION_ID,
    true,
    true,
    true,
    TrackingConsent.GRANTED,
    true
  )
  DataDogConfig.nativeCrashReportEnabled = true
  DataDogConfig.sessionSamplingRate = 100
  DataDogConfig.nativeViewTracking = true
  DataDogConfig.resourceTracingSamplingRate = 100
  DataDogConfig.site = SITE
  DataDogConfig.version = DeviceInfo.getBuildNumber()
  DataDogConfig.verbosity = SdkVerbosity.DEBUG
  DataDogConfig.initializationMode = InitializationMode.ASYNC
  DataDogConfig.batchSize = BatchSize.SMALL

  return DataDogConfig
}
