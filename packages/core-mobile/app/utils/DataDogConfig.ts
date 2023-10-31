import { DdSdkReactNativeConfiguration } from '@datadog/mobile-react-native'

let DataDogConfig: DdSdkReactNativeConfiguration | null = null

if (
  process.env.DD_CLIENT_TOKEN &&
  process.env.ENVIRONMENT &&
  process.env.DD_APPLICATION_ID &&
  process.env.DD_SITE &&
  process.env.BUILD_NUMBER
) {
  DataDogConfig = new DdSdkReactNativeConfiguration(
    process.env.DD_CLIENT_TOKEN,
    process.env.ENVIRONMENT,
    process.env.DD_APPLICATION_ID,
    true,
    true,
    true
  )

  DataDogConfig.site = process.env.DD_SITE
  DataDogConfig.nativeCrashReportEnabled = true
  DataDogConfig.nativeViewTracking = true
  DataDogConfig.sessionSamplingRate = 80
  DataDogConfig.resourceTracingSamplingRate = 80
  DataDogConfig.version = process.env.BUILD_NUMBER
}

export default DataDogConfig
