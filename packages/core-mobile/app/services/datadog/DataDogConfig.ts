import {
  TrackingConsent,
  DatadogProviderConfiguration,
  DdLogs
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
    TrackingConsent.GRANTED
  )
  DataDogConfig.nativeCrashReportEnabled = true
  DataDogConfig.sessionSamplingRate = 100
  DataDogConfig.nativeViewTracking = true
  DataDogConfig.resourceTracingSamplingRate = 100
  DataDogConfig.site = SITE
  DataDogConfig.version = DeviceInfo.getBuildNumber()

  return DataDogConfig
}

export function onDatadogInitializationComplete(): void {
  DdLogs.info('Datadog initialization complete')
}
